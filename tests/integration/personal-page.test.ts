import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

describe('Personal Page & Social Ingestion API (Integration)', () => {
  let app: FastifyInstance;
  let accessToken: string;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();

    // Authenticate as seed user
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        provider: 'local',
        email: 'somchai@momentra.app',
        password: 'Password123!',
      },
    });

    const body = JSON.parse(loginRes.body);
    accessToken = body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/personal/discover should return candidate items', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/personal/discover',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        fullName: 'สมชาย วิจิตรานันท์',
        category: 'youtube',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
    expect(body.data[0].platform).toBe('youtube');
  });

  it('POST /api/v1/personal/parse-link should extract metadata and suggest event date', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/personal/parse-link',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.platform).toBe('youtube');
    expect(body.data.embedHtml).toContain('youtube-nocookie.com');
  });

  it('PATCH /api/v1/personal/page-settings should update user profile settings', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/personal/page-settings',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        username: 'somchai_hdam',
        isPagePublished: true,
        pageTemplate: 'bento',
        pageBio: 'คลังประวัติศาสตร์และผลงานดิจิทัลส่วนตัว',
        pageTheme: { theme: 'dark', accent: '#3b82f6' },
        socialLinks: {
          youtube: 'https://youtube.com/@somchai',
        },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.username).toBe('somchai_hdam');
    expect(body.data.is_page_published).toBe(true);
    expect(body.data.page_template).toBe('bento');
  });

  it('POST /api/v1/personal/import-link should add curated item to user timeline', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/personal/import-link',
      headers: { authorization: `Bearer ${accessToken}` },
      payload: {
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        title: 'สารคดีชีวิตและผลงานชิ้นเอก',
        description: 'การเปิดตัวผลงานประวัติศาสตร์ครั้งสำคัญ',
        eventDate: '2023-06-15',
        datePrecision: 'day',
        isCirca: false,
        isPublic: true,
        embedMetadata: {
          platform: 'youtube',
          videoId: 'dQw4w9WgXcQ',
        },
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.data.title).toBe('สารคดีชีวิตและผลงานชิ้นเอก');
    expect(body.data.is_public).toBe(true);
  });

  it('GET /api/v1/public/:username should return public showcase data', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/somchai_hdam',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.data.profile.username).toBe('somchai_hdam');
    expect(body.data.profile.fullName).toBe('สมชาย วิจิตรานันท์');
    expect(Array.isArray(body.data.items)).toBe(true);
    expect(body.data.items.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/public/:username should return 404 for unknown or unpublished users', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/public/nonexistent_person_9999',
    });

    expect(res.statusCode).toBe(404);
  });
});
