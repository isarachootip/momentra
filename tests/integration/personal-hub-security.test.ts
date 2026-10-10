import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../src/app.js';
import { pool } from '../../src/db/pool.js';

describe('Personal Hub Security & Visibility Isolation (Integration)', () => {
  let app: FastifyInstance;
  let testUserId: string;
  let testWorkspaceId: string;
  const username = 'drmum_test_' + Math.random().toString(36).substring(2, 7);

  beforeAll(async () => {
    app = buildApp();
    await app.ready();

    // Warm up pool connection
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await pool.query('SELECT 1');
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 1000));
      }
    }

    // 1. Create test user
    const uRes = await pool.query(
      `INSERT INTO users (email, password_hash, full_name, username, is_page_published)
       VALUES ('sec_' || gen_random_uuid() || '@momentra.app', 'dummy_hash', 'Dr. Mum Test', $1, true)
       RETURNING id`,
      [username]
    );
    testUserId = uRes.rows[0].id;

    // 2. Create personal workspace for test user
    const wsRes = await pool.query(
      `INSERT INTO workspaces (slug, name, type)
       VALUES ('ws-' || gen_random_uuid(), 'Dr Mum Workspace', 'personal')
       RETURNING id`
    );
    testWorkspaceId = wsRes.rows[0].id;

    await pool.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [testWorkspaceId, testUserId]
    );

    // 3. Insert 1 Public Social Link & 1 Private Social Link
    await pool.query(
      `INSERT INTO user_social_links (user_id, platform, label, url, link_group, visibility, sort_order)
       VALUES 
       ($1, 'youtube', 'DrMum Official YouTube', 'https://youtube.com/@drmum', 'official', 'public', 1),
       ($1, 'line', 'Private Contact LINE', 'https://line.me/ti/p/~secret', 'personal', 'private', 2)`,
      [testUserId]
    );

    // 4. Insert 1 Public KM Item & 1 Private KM Item
    await pool.query(
      `INSERT INTO items (workspace_id, type, km_category, title, description, event_start, event_end, sort_key, visibility, is_public, created_by)
       VALUES 
       ($1, 'note', 'article', 'Public Medical Treatise', 'Public research summary', NOW(), NOW(), 1, 'public', true, $2),
       ($1, 'note', 'note', 'Confidential Patient Diary', 'Secret notes not for public', NOW(), NOW(), 2, 'private', false, $2)`,
      [testWorkspaceId, testUserId]
    );
  });

  afterAll(async () => {
    if (testUserId) {
      await pool.query(`DELETE FROM users WHERE id = $1`, [testUserId]);
    }
    if (testWorkspaceId) {
      await pool.query(`DELETE FROM workspaces WHERE id = $1`, [testWorkspaceId]);
    }
    await app.close();
  });

  it('GET /api/v1/public/:username strictly NEVER returns private links or private KM items', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/public/${username}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);

    // Profile verification
    expect(body.data.profile.username).toBe(username);
    expect(body.data.profile.fullName).toBe('Dr. Mum Test');

    // Social Links Isolation Verification
    const officialLinks = body.data.profile.officialLinks;
    const personalLinks = body.data.profile.personalLinks;

    expect(officialLinks.length).toBe(1);
    expect(officialLinks[0].label).toBe('DrMum Official YouTube');

    // Private LINE link MUST NOT be present
    expect(personalLinks.length).toBe(0);
    const allLabels = [...officialLinks, ...personalLinks].map((l: any) => l.label);
    expect(allLabels).not.toContain('Private Contact LINE');

    // KM Items Isolation Verification
    const items = body.data.items;
    expect(items.length).toBe(1);
    expect(items[0].title).toBe('Public Medical Treatise');

    // Private KM item MUST NOT be present
    const titles = items.map((i: any) => i.title);
    expect(titles).not.toContain('Confidential Patient Diary');
  });
});
