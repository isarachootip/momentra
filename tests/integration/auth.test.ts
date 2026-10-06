import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';

describe('Auth & Me Endpoints (Integration)', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /api/v1/auth/login should return 400 Problem Details on invalid payload', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: { provider: 'local' }, // missing email and password
    });

    expect(response.statusCode).toBe(400);
    expect(response.headers['content-type']).toContain('application/problem+json');
    const problem = JSON.parse(response.body);
    expect(problem.type).toBe('https://momentra.app/errors/validation-failed');
    expect(problem.status).toBe(400);
    expect(Array.isArray(problem.invalid_params)).toBe(true);
  });

  it('POST /api/v1/auth/login should return 401 Problem Details on wrong password', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        provider: 'local',
        email: 'somchai@momentra.app',
        password: 'IncorrectPassword',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.headers['content-type']).toContain('application/problem+json');
    const problem = JSON.parse(response.body);
    expect(problem.code).toBe('UNAUTHORIZED');
  });

  it('POST /api/v1/auth/login should succeed with valid seed credentials', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        provider: 'local',
        email: 'somchai@momentra.app',
        password: 'Password123!',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body.token_type).toBe('Bearer');
    expect(typeof body.access_token).toBe('string');
    expect(typeof body.refresh_token).toBe('string');
    expect(body.user.email).toBe('somchai@momentra.app');
    expect(body.user.full_name).toBe('สมชาย วิจิตรานันท์');
  });

  it('GET /api/v1/me should reject request without Bearer token', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
    });

    expect(response.statusCode).toBe(401);
    const problem = JSON.parse(response.body);
    expect(problem.code).toBe('UNAUTHORIZED');
  });

  it('Complete Flow: Login -> Get /me -> Refresh Token -> Logout', async () => {
    // 1. Login
    const loginRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        provider: 'local',
        email: 'somchai@momentra.app',
        password: 'Password123!',
      },
    });
    expect(loginRes.statusCode).toBe(200);
    const authData = JSON.parse(loginRes.body);
    const { access_token, refresh_token } = authData;

    // 2. GET /api/v1/me with Bearer token
    const meRes = await app.inject({
      method: 'GET',
      url: '/api/v1/me',
      headers: {
        authorization: `Bearer ${access_token}`,
      },
    });
    expect(meRes.statusCode).toBe(200);
    const meData = JSON.parse(meRes.body);
    expect(meData.id).toBe(authData.user.id);
    expect(meData.email).toBe('somchai@momentra.app');
    expect(Array.isArray(meData.workspaces)).toBe(true);
    expect(meData.workspaces.length).toBeGreaterThan(0);

    // 3. POST /api/v1/auth/refresh
    const refreshRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/refresh',
      payload: {
        refresh_token,
      },
    });
    expect(refreshRes.statusCode).toBe(200);
    const newTokens = JSON.parse(refreshRes.body);
    expect(typeof newTokens.access_token).toBe('string');
    expect(typeof newTokens.refresh_token).toBe('string');
    expect(newTokens.refresh_token).not.toBe(refresh_token);

    // 4. POST /api/v1/auth/logout
    const logoutRes = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/logout',
      payload: {
        refresh_token: newTokens.refresh_token,
      },
    });
    expect(logoutRes.statusCode).toBe(204);
  });
});
