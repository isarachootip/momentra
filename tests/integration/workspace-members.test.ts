import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { tokenService } from '../../src/core/security/token-service.js';

describe('Workspace & Member Management API (Integration)', () => {
  let app: FastifyInstance;
  const testUserId = 'a1111111-1111-1111-1111-111111111111';
  let authHeader: string;
  let createdWsId: string;
  let invitedUserId: string;

  beforeAll(async () => {
    app = buildApp();
    await app.ready();

    const { tokens } = tokenService.generateTokenPair(testUserId, 'somchai@momentra.app');
    authHeader = `Bearer ${tokens.access_token}`;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/v1/workspaces should require authentication', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/workspaces' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /api/v1/workspaces should create a new organization workspace', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/workspaces',
      headers: { authorization: authHeader },
      payload: {
        name: 'National Digital Archive',
        slug: `nda-test-${Date.now()}`,
        type: 'organization',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.id).toBeDefined();
    expect(body.name).toBe('National Digital Archive');
    expect(body.role).toBe('owner');
    createdWsId = body.id;
  });

  it('GET /api/v1/workspaces/:id should retrieve workspace details', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/workspaces/${createdWsId}`,
      headers: { authorization: authHeader },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.id).toBe(createdWsId);
    expect(body.role).toBe('owner');
  });

  it('PATCH /api/v1/workspaces/:id should update workspace name', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/workspaces/${createdWsId}`,
      headers: { authorization: authHeader },
      payload: { name: 'Renamed Digital Archive' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.name).toBe('Renamed Digital Archive');
  });

  it('GET /api/v1/workspaces/:id/members should list members including owner', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/workspaces/${createdWsId}/members`,
      headers: { authorization: authHeader },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.some((m: { role: string }) => m.role === 'owner')).toBe(true);
  });

  it('POST /api/v1/workspaces/:id/members/invite should invite new user by email', async () => {
    const inviteEmail = `archivist.${Date.now()}@momentra.app`;
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/workspaces/${createdWsId}/members/invite`,
      headers: { authorization: authHeader },
      payload: {
        email: inviteEmail,
        role: 'contributor',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.email).toBe(inviteEmail);
    expect(body.role).toBe('contributor');
    invitedUserId = body.user_id;
  });

  it('PATCH /api/v1/workspaces/:id/members/:userId should change member role to admin', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/workspaces/${createdWsId}/members/${invitedUserId}`,
      headers: { authorization: authHeader },
      payload: { role: 'admin' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.role).toBe('admin');
  });

  it('DELETE /api/v1/workspaces/:id/members/:userId should remove member', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/v1/workspaces/${createdWsId}/members/${invitedUserId}`,
      headers: { authorization: authHeader },
    });

    expect(res.statusCode).toBe(204);
  });

  it('GET /api/v1/users should list system users with pagination', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users?limit=5&offset=0',
      headers: { authorization: authHeader },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body.users)).toBe(true);
    expect(body.total).toBeGreaterThanOrEqual(1);
  });

  it('PATCH /api/v1/me should update current user profile', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: { authorization: authHeader },
      payload: { full_name: 'Somchai Updated Profile' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.full_name).toBe('Somchai Updated Profile');

    // Restore original name for other integration tests
    await app.inject({
      method: 'PATCH',
      url: '/api/v1/me',
      headers: { authorization: authHeader },
      payload: { full_name: 'สมชาย วิจิตรานันท์' },
    });
  });
});
