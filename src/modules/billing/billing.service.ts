import { pool } from '../../db/pool.js';
import { NotFoundError } from '../../core/errors/app-error.js';
import type {
  SubscriptionPlan,
  UserSubscription,
  PaymentInvoice,
} from './billing.types.js';
import type { CreateCheckoutInput, BillingWebhookInput } from './billing.schemas.js';

export class BillingService {
  public async getPlans(): Promise<SubscriptionPlan[]> {
    const res = await pool.query(
      `SELECT plan_code, name, price_thb_monthly, max_links, max_km_items, max_storage_bytes, features, created_at
       FROM subscription_plans
       ORDER BY price_thb_monthly ASC`
    );
    return res.rows.map((r) => ({
      plan_code: r.plan_code,
      name: r.name,
      price_thb_monthly: Number(r.price_thb_monthly),
      max_links: Number(r.max_links),
      max_km_items: Number(r.max_km_items),
      max_storage_bytes: Number(r.max_storage_bytes),
      features: r.features ?? {},
      created_at: r.created_at?.toISOString?.() ?? new Date().toISOString(),
    }));
  }

  public async getUserSubscription(userId: string): Promise<UserSubscription> {
    const res = await pool.query(`SELECT * FROM user_subscriptions WHERE user_id = $1`, [userId]);
    if (res.rowCount === 0) {
      const initRes = await pool.query(
        `INSERT INTO user_subscriptions (user_id, plan_code, status, payment_provider)
         VALUES ($1, 'free', 'active', 'system')
         ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW()
         RETURNING *`,
        [userId]
      );
      return initRes.rows[0];
    }
    return res.rows[0];
  }

  public async getInvoices(userId: string): Promise<PaymentInvoice[]> {
    const res = await pool.query(
      `SELECT * FROM payment_invoices WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [userId]
    );
    return res.rows;
  }

  public async createCheckoutSession(
    userId: string,
    input: CreateCheckoutInput
  ): Promise<{ checkoutUrl: string; sessionId: string; promptPayQrText?: string | undefined }> {
    const planRes = await pool.query(`SELECT * FROM subscription_plans WHERE plan_code = $1`, [input.planCode]);
    if (planRes.rowCount === 0) {
      throw new NotFoundError(`Plan ${input.planCode} not found`);
    }
    const plan = planRes.rows[0];
    const sessionId = `cs_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // If free plan, immediately activate
    if (plan.price_thb_monthly === 0) {
      await this.processWebhook({
        provider: 'system',
        event: 'checkout.session.completed',
        data: { userId, planCode: 'free', status: 'active' },
      });
      return { checkoutUrl: input.successUrl || '/hub/billing', sessionId };
    }

    const promptPayQr = input.paymentMethod === 'promptpay'
      ? `00020101021229370016A000000677010111011300668123456785802TH5303764540${plan.price_thb_monthly}.006304`
      : undefined;

    return {
      checkoutUrl: `/hub/billing?session_id=${sessionId}&method=${input.paymentMethod}`,
      sessionId,
      promptPayQrText: promptPayQr,
    };
  }

  public async processWebhook(input: BillingWebhookInput): Promise<{ received: boolean; idempotent?: boolean }> {
    const { event, data, eventId, provider = 'stripe' } = input;
    if (!data.userId) return { received: true };

    // 1. Idempotency Check
    if (eventId) {
      const existing = await pool.query(`SELECT 1 FROM processed_webhook_events WHERE event_id = $1`, [eventId]);
      if ((existing.rowCount ?? 0) > 0) {
        return { received: true, idempotent: true };
      }
    }

    if (event === 'checkout.session.completed' || event === 'invoice.payment_succeeded') {
      const planCode = data.planCode ?? 'pro';
      const periodEnd = data.periodEnd ? new Date(data.periodEnd) : new Date(Date.now() + 30 * 86400000);

      const subRes = await pool.query(
        `INSERT INTO user_subscriptions (
           user_id, plan_code, status, payment_provider, current_period_start, current_period_end, updated_at
         ) VALUES ($1, $2, 'active', $3, NOW(), $4, NOW())
         ON CONFLICT (user_id) DO UPDATE SET
           plan_code = EXCLUDED.plan_code,
           status = 'active',
           current_period_end = EXCLUDED.current_period_end,
           updated_at = NOW()
         RETURNING id`,
        [data.userId, planCode, provider, periodEnd]
      );

      if (data.amountThb && data.amountThb > 0) {
        await pool.query(
          `INSERT INTO payment_invoices (subscription_id, user_id, amount_thb, payment_method, status, paid_at)
           VALUES ($1, $2, $3, $4, 'paid', NOW())`,
          [subRes.rows[0]?.id, data.userId, data.amountThb, data.paymentMethod ?? 'promptpay']
        );
      }
    } else if (event === 'invoice.payment_failed') {
      // PromptPay 3-Day Grace Period Logic
      const subCheck = await pool.query(`SELECT current_period_end FROM user_subscriptions WHERE user_id = $1`, [data.userId]);
      const currentPeriodEnd = subCheck.rows[0]?.current_period_end ? new Date(subCheck.rows[0].current_period_end) : new Date();
      const gracePeriodEnd = new Date(currentPeriodEnd.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days grace

      const isPastGrace = Date.now() > gracePeriodEnd.getTime();
      const newStatus = isPastGrace ? 'past_due' : 'active';

      await pool.query(
        `UPDATE user_subscriptions SET status = $1, updated_at = NOW() WHERE user_id = $2`,
        [newStatus, data.userId]
      );
    } else if (event === 'customer.subscription.deleted') {
      await pool.query(`UPDATE user_subscriptions SET status = 'canceled', updated_at = NOW() WHERE user_id = $1`, [data.userId]);
    }

    // 2. Mark event as processed
    if (eventId) {
      await pool.query(
        `INSERT INTO processed_webhook_events (event_id, event_type, payment_provider, payload)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (event_id) DO NOTHING`,
        [eventId, event, provider, JSON.stringify(data)]
      );
    }

    return { received: true };
  }
}

export const billingService = new BillingService();
