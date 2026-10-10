import { describe, it, expect, vi, beforeEach } from 'vitest';
import { quotaService } from '../../src/modules/billing/quota.service.js';
import { pool } from '../../src/db/pool.js';
import { ForbiddenError } from '../../src/core/errors/app-error.js';

vi.mock('../../src/db/pool.js', () => ({
  pool: {
    query: vi.fn(),
  },
}));

describe('QuotaService (Unit)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return valid quota status for free plan user within limits', async () => {
    vi.mocked(pool.query)
      // 1. Subscription & Plan
      .mockResolvedValueOnce({
        rows: [
          {
            plan_code: 'free',
            name: 'Free Starter',
            price_thb_monthly: 0,
            max_links: 5,
            max_km_items: 20,
            max_storage_bytes: 524288000,
            features: {},
            status: 'active',
          },
        ],
        rowCount: 1,
      } as any)
      // 2. Links count
      .mockResolvedValueOnce({ rows: [{ count: 3 }], rowCount: 1 } as any)
      // 3. KM count
      .mockResolvedValueOnce({ rows: [{ count: 12 }], rowCount: 1 } as any)
      // 4. Storage bytes
      .mockResolvedValueOnce({ rows: [{ bytes: 104857600 }], rowCount: 1 } as any);

    const status = await quotaService.getQuotaStatus('user-uuid-1');

    expect(status.plan.plan_code).toBe('free');
    expect(status.status).toBe('active');
    expect(status.canCreate).toBe(true);
    expect(status.links.used).toBe(3);
    expect(status.links.limit).toBe(5);
    expect(status.links.isExceeded).toBe(false);
    expect(status.kmItems.used).toBe(12);
    expect(status.kmItems.isExceeded).toBe(false);
  });

  it('should throw ForbiddenError when link quota is exceeded', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({
        rows: [
          {
            plan_code: 'free',
            name: 'Free Starter',
            max_links: 5,
            max_km_items: 20,
            max_storage_bytes: 524288000,
            status: 'active',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ count: 5 }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ count: 10 }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ bytes: 0 }], rowCount: 1 } as any);

    await expect(quotaService.assertCanCreateLink('user-uuid-1')).rejects.toThrow(
      ForbiddenError
    );
  });

  it('should block creation when subscription status is past_due (soft lock)', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({
        rows: [
          {
            plan_code: 'pro',
            name: 'Pro Personal Hub',
            max_links: -1,
            max_km_items: -1,
            max_storage_bytes: 21474836480,
            status: 'past_due',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ count: 20 }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ count: 50 }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ bytes: 1000 }], rowCount: 1 } as any);

    await expect(quotaService.assertCanCreateKmItem('user-uuid-1')).rejects.toThrow(
      /past due or inactive/
    );
  });

  it('should allow unlimited creation on Pro active plan', async () => {
    vi.mocked(pool.query)
      .mockResolvedValueOnce({
        rows: [
          {
            plan_code: 'pro',
            name: 'Pro Personal Hub',
            max_links: -1,
            max_km_items: -1,
            max_storage_bytes: 21474836480,
            status: 'active',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ count: 100 }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ count: 200 }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ bytes: 1000 }], rowCount: 1 } as any);

    await expect(quotaService.assertCanCreateLink('user-uuid-pro')).resolves.toBeUndefined();

    // Mock again for assertCanCreateKmItem
    vi.mocked(pool.query)
      .mockResolvedValueOnce({
        rows: [
          {
            plan_code: 'pro',
            name: 'Pro Personal Hub',
            max_links: -1,
            max_km_items: -1,
            max_storage_bytes: 21474836480,
            status: 'active',
          },
        ],
        rowCount: 1,
      } as any)
      .mockResolvedValueOnce({ rows: [{ count: 100 }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ count: 200 }], rowCount: 1 } as any)
      .mockResolvedValueOnce({ rows: [{ bytes: 1000 }], rowCount: 1 } as any);

    await expect(quotaService.assertCanCreateKmItem('user-uuid-pro')).resolves.toBeUndefined();
  });
});
