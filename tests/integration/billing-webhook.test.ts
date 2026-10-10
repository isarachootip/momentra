import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';

describe('Billing & Webhooks API (Integration)', () => {
  let app: FastifyInstance;
  let testUserId: string;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();

    // Warm up pool connection with retry
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await pool.query('SELECT 1');
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // Create a temporary test user
    const res = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, username)
       VALUES ('billing_test_' || gen_random_uuid() || '@momentra.app', 'dummy_hash', 'Billing Tester', 'billtest_' || substr(md5(random()::text), 1, 6))
       RETURNING id`
    );
    testUserId = res.rows[0].id;
  });

  afterAll(async () => {
    if (testUserId) {
      await pool.query(`DELETE FROM users WHERE id = $1`, [testUserId]);
    }
    await app.close();
  });

  it('GET /api/v1/billing/plans should return all tiers in ascending price', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/billing/plans',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(3);
    expect(body.data[0].plan_code).toBe('free');
    expect(body.data[0].price_thb_monthly).toBe(0);
  });

  it('POST /api/v1/billing/webhook should process payment and activate Pro tier', async () => {
    const webhookRes = await app.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      payload: {
        event: 'invoice.payment_succeeded',
        data: {
          userId: testUserId,
          planCode: 'pro',
          amountThb: 199,
          paymentMethod: 'promptpay',
        },
      },
    });

    expect(webhookRes.statusCode).toBe(200);

    const subRes = await pool.query(
      `SELECT * FROM user_subscriptions WHERE user_id = $1`,
      [testUserId]
    );
    expect(subRes.rowCount).toBe(1);
    expect(subRes.rows[0].plan_code).toBe('pro');
    expect(subRes.rows[0].status).toBe('active');

    const invRes = await pool.query(
      `SELECT * FROM payment_invoices WHERE user_id = $1`,
      [testUserId]
    );
    expect(invRes.rowCount).toBe(1);
    expect(invRes.rows[0].amount_thb).toBe(199);
  });

  it('POST /api/v1/billing/webhook should transition status to past_due on invoice failure', async () => {
    const webhookRes = await app.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      payload: {
        event: 'invoice.payment_failed',
        data: {
          userId: testUserId,
        },
      },
    });

    expect(webhookRes.statusCode).toBe(200);

    const subRes = await pool.query(
      `SELECT status FROM user_subscriptions WHERE user_id = $1`,
      [testUserId]
    );
    expect(subRes.rowCount).toBe(1);
  });

  it('POST /api/v1/billing/webhook should handle duplicate eventId idempotently', async () => {
    const eventId = 'evt_test_idempotency_' + Math.random().toString(36).substring(2, 9);
    const payload = {
      eventId,
      provider: 'stripe' as const,
      event: 'invoice.payment_succeeded' as const,
      data: {
        userId: testUserId,
        planCode: 'pro' as const,
        amountThb: 199,
      },
    };

    // First call
    const res1 = await app.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      payload,
    });
    expect(res1.statusCode).toBe(200);
    const body1 = JSON.parse(res1.body);
    expect(body1.received).toBe(true);
    expect(body1.idempotent).toBeUndefined();

    // Duplicate call with same eventId
    const res2 = await app.inject({
      method: 'POST',
      url: '/api/v1/billing/webhook',
      payload,
    });
    expect(res2.statusCode).toBe(200);
    const body2 = JSON.parse(res2.body);
    expect(body2.received).toBe(true);
    expect(body2.idempotent).toBe(true);
  });
});
