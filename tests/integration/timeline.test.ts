import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

import { tokenService } from '../../src/core/security/token-service.js';

describe('Timeline API (Integration)', () => {
  let app: FastifyInstance;
  let token: string;
  const orgWsId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    app = buildApp();
    await app.ready();

    const { tokens } = tokenService.generateTokenPair(
      'a1111111-1111-1111-1111-111111111111',
      'somchai@momentra.app'
    );
    token = tokens.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/timeline should reject unauthenticated requests with 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/timeline?from=1930-01-01T00:00:00Z&to=1940-12-31T23:59:59Z&granularity=year',
    });

    expect(res.statusCode).toBe(401);
  });

  it('GET /api/v1/timeline should return year-bucketed timeline in B.E. standard', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/timeline?from=1930-01-01T00:00:00Z&to=1940-12-31T23:59:59Z&granularity=year&calendar=be',
      headers: {
        authorization: `Bearer ${token}`,
        'x-workspace-id': orgWsId,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.granularity).toBe('year');
    expect(body.calendar).toBe('be');
    expect(Array.isArray(body.buckets)).toBe(true);
    expect(body.buckets.length).toBeGreaterThan(0);

    // Verify 1932 bucket
    const bucket1932 = body.buckets.find((b: { bucket_key: string }) => b.bucket_key === '1932');
    expect(bucket1932).toBeDefined();
    expect(bucket1932.display_label).toContain('2475');
    expect(bucket1932.items.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/timeline should return decade-bucketed timeline in C.E. standard', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/timeline?from=1900-01-01T00:00:00Z&to=2000-12-31T23:59:59Z&granularity=decade&calendar=ce',
      headers: {
        authorization: `Bearer ${token}`,
        'x-workspace-id': orgWsId,
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.granularity).toBe('decade');
    expect(body.calendar).toBe('ce');
    expect(Array.isArray(body.buckets)).toBe(true);
  });
});
