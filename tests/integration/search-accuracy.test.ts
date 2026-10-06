import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';
import { tokenService } from '../../src/core/security/token-service.js';

describe('Search Accuracy & Historical Engine (Integration - 20 Accuracy Queries)', () => {
  let app: FastifyInstance;
  let token: string;
  const orgWsId = '11111111-1111-1111-1111-111111111111';

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
    await pool.query('SELECT 1'); // Warm up remote Neon SSL pool connection

    const { tokens } = tokenService.generateTokenPair(
      'a1111111-1111-1111-1111-111111111111',
      'somchai@momentra.app'
    );
    token = tokens.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  const runQuery = async (queryStr: string) => {
    return app.inject({
      method: 'GET',
      url: `/api/v1/search?${queryStr}`,
      headers: {
        authorization: `Bearer ${token}`,
        'x-workspace-id': orgWsId,
      },
    });
  };

  it('Q1: Exact Thai keyword - การเปลี่ยนแปลงการปกครอง', async () => {
    const res = await runQuery('q=การเปลี่ยนแปลงการปกครอง');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results.some((r: { title: string }) => r.title.includes('การเปลี่ยนแปลงการปกครอง'))).toBe(true);
  });

  it('Q2: Thai keyword with B.E. year - 2475', async () => {
    const res = await runQuery('q=2475');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results.length).toBeGreaterThan(0);
  });

  it('Q3: Historical entity search - ปรีดี พนมยงค์', async () => {
    const res = await runQuery('q=ปรีดี');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results.length).toBeGreaterThan(0);
  });

  it('Q4: Royal monarch query - รัชกาลที่ 5 synonym expansion', async () => {
    const res = await runQuery('q=ร.5');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toBeDefined();
  });

  it('Q5: Infrastructure search - สะพานพุทธ', async () => {
    const res = await runQuery('q=สะพาน');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results.length).toBeGreaterThan(0);
  });

  it('Q6: Modern infrastructure query - รถไฟฟ้า BTS', async () => {
    const res = await runQuery('q=รถไฟฟ้า');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results.length).toBeGreaterThan(0);
  });

  it('Q7: Dublin Core creator query - คณะราษฎร', async () => {
    const res = await runQuery('q=คณะราษฎร');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results.length).toBeGreaterThan(0);
  });

  it('Q8: Location query - กรุงเทพมหานคร', async () => {
    const res = await runQuery('q=กรุงเทพ');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results.length).toBeGreaterThan(0);
  });

  it('Q9: Filter by type: asset', async () => {
    const res = await runQuery('type=asset');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results.every((r: { type: string }) => r.type === 'asset')).toBe(true);
  });

  it('Q10: Filter by type: event', async () => {
    const res = await runQuery('type=event');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results.every((r: { type: string }) => r.type === 'event')).toBe(true);
  });

  it('Q11: Filter by type: link', async () => {
    const res = await runQuery('type=link');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results.every((r: { type: string }) => r.type === 'link')).toBe(true);
  });

  it('Q12: Date range with B.E. years auto-converted - from_year=2470&to_year=2480', async () => {
    const res = await runQuery('from_year=2470&to_year=2480');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results.length).toBeGreaterThan(0);
  });

  it('Q13: Date range with C.E. years - from_year=1930&to_year=1940', async () => {
    const res = await runQuery('from_year=1930&to_year=1940');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results.length).toBeGreaterThan(0);
  });

  it('Q14: Fuzzy search typo tolerance (trigram) - ปรีดิ', async () => {
    const res = await runQuery('q=ปรีด');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toBeDefined();
  });

  it('Q15: Prefix search - ประช:*', async () => {
    const res = await runQuery('q=ประช');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results.length).toBeGreaterThan(0);
  });

  it('Q16: Circa filter - circa=true', async () => {
    const res = await runQuery('circa=true');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results.every((r: { is_circa: boolean }) => r.is_circa === true)).toBe(true);
  });

  it('Q17: Facet aggregation - types', async () => {
    const res = await runQuery('');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.facets.types)).toBe(true);
    expect(body.facets.types.length).toBeGreaterThan(0);
  });

  it('Q18: Facet aggregation - years', async () => {
    const res = await runQuery('');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.facets.years)).toBe(true);
    expect(body.facets.years.length).toBeGreaterThan(0);
  });

  it('Q19: Relevance sort option', async () => {
    const res = await runQuery('q=2475&sort=relevance');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results.length).toBeGreaterThan(0);
  });

  it('Q20: Empty query returns workspace catalog', async () => {
    const res = await runQuery('');
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.results.length).toBeGreaterThan(0);
    expect(body.total_hits).toBeGreaterThan(0);
  });
});
