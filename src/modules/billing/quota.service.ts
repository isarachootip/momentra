import { pool } from '../../db/pool.js';
import { ForbiddenError } from '../../core/errors/app-error.js';
import type {
  SubscriptionPlan,
  SubscriptionStatus,
  QuotaStatus,
  QuotaItemStatus,
} from './billing.types.js';

export class QuotaService {
  private calculateItemQuota(used: number, limit: number): QuotaItemStatus {
    const isExceeded = limit !== -1 && used >= limit;
    const percentage = limit === -1 ? 0 : Math.min(100, Math.round((used / limit) * 100));
    return { used, limit, percentage, isExceeded };
  }

  public async getQuotaStatus(userId: string): Promise<QuotaStatus> {
    const subRes = await pool.query(
      `SELECT us.*, sp.name, sp.price_thb_monthly, sp.max_links, sp.max_km_items, sp.max_storage_bytes, sp.features
       FROM subscription_plans sp
       LEFT JOIN user_subscriptions us ON us.plan_code = sp.plan_code AND us.user_id = $1
       WHERE us.user_id = $1 OR sp.plan_code = 'free'
       ORDER BY (us.user_id IS NOT NULL) DESC
       LIMIT 1`,
      [userId]
    );

    const row = subRes.rows[0];
    const plan: SubscriptionPlan = {
      plan_code: row.plan_code ?? 'free',
      name: row.name,
      price_thb_monthly: Number(row.price_thb_monthly),
      max_links: Number(row.max_links),
      max_km_items: Number(row.max_km_items),
      max_storage_bytes: Number(row.max_storage_bytes),
      features: row.features ?? {},
      created_at: row.created_at?.toISOString?.() ?? new Date().toISOString(),
    };

    const status: SubscriptionStatus = row.status ?? 'active';

    const [linksRes, kmRes, storageRes] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS count FROM user_social_links WHERE user_id = $1`, [userId]),
      pool.query(`SELECT COUNT(*)::int AS count FROM items WHERE created_by = $1 AND deleted_at IS NULL`, [userId]),
      pool.query(
        `SELECT COALESCE(SUM(a.size_bytes), 0)::bigint AS bytes
         FROM items i
         JOIN assets a ON a.item_id = i.id
         WHERE i.created_by = $1 AND i.deleted_at IS NULL`,
        [userId]
      ),
    ]);

    const linksUsed = linksRes.rows[0]?.count ?? 0;
    const kmUsed = kmRes.rows[0]?.count ?? 0;
    const storageUsed = Number(storageRes.rows[0]?.bytes ?? 0);

    const linksQuota = this.calculateItemQuota(linksUsed, plan.max_links);
    const kmQuota = this.calculateItemQuota(kmUsed, plan.max_km_items);
    const storageQuota = this.calculateItemQuota(storageUsed, plan.max_storage_bytes);

    const isSoftLocked = status === 'past_due' || status === 'canceled';
    const canCreate = !isSoftLocked && !linksQuota.isExceeded && !kmQuota.isExceeded;

    return {
      plan,
      status,
      canCreate,
      links: linksQuota,
      kmItems: kmQuota,
      storageBytes: storageQuota,
    };
  }

  public async assertCanCreateLink(userId: string): Promise<void> {
    const quota = await this.getQuotaStatus(userId);
    if (quota.status === 'past_due' || quota.status === 'canceled') {
      throw new ForbiddenError('Subscription is past due or inactive. Please upgrade or renew.');
    }
    if (quota.links.isExceeded) {
      throw new ForbiddenError(`Link quota exceeded (${quota.links.used}/${quota.links.limit}). Upgrade to Pro for unlimited.`);
    }
  }

  public async assertCanCreateKmItem(userId: string): Promise<void> {
    const quota = await this.getQuotaStatus(userId);
    if (quota.status === 'past_due' || quota.status === 'canceled') {
      throw new ForbiddenError('Subscription is past due or inactive. Please upgrade or renew.');
    }
    if (quota.kmItems.isExceeded) {
      throw new ForbiddenError(`KM items quota exceeded (${quota.kmItems.used}/${quota.kmItems.limit}). Upgrade to Pro for unlimited.`);
    }
  }

  public async assertCanUploadBytes(userId: string, additionalBytes: number): Promise<void> {
    const quota = await this.getQuotaStatus(userId);
    if (quota.status === 'past_due' || quota.status === 'canceled') {
      throw new ForbiddenError('Subscription is past due or inactive. Please upgrade or renew.');
    }
    const projected = quota.storageBytes.used + additionalBytes;
    if (quota.storageBytes.limit !== -1 && projected > quota.storageBytes.limit) {
      throw new ForbiddenError('Storage quota exceeded. Please upgrade for more storage capacity.');
    }
  }
}

export const quotaService = new QuotaService();
