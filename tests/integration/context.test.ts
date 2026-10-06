import { describe, it, expect } from 'vitest';
import { withSystemContext, withWorkspaceContext } from '../../src/db/context.js';

describe('Database Context Helpers (Integration)', () => {
  it('should execute query under system context', async () => {
    const result = await withSystemContext(async (client) => {
      const res = await client.query('SELECT 1 + 1 AS sum;');
      return res.rows[0];
    });

    expect(result).toBeDefined();
    expect(Number(result.sum)).toBe(2);
  });

  it('should execute query with workspace RLS context', async () => {
    const workspaceId = '00000000-0000-0000-0000-000000000001';
    const result = await withWorkspaceContext(workspaceId, async (client) => {
      const res = await client.query(`SELECT current_setting('app.current_workspace_id', true) AS ws;`);
      return res.rows[0];
    });

    expect(result).toBeDefined();
    expect(result.ws).toBe(workspaceId);
  });

  it('should rollback transaction on error in withWorkspaceContext', async () => {
    const workspaceId = '00000000-0000-0000-0000-000000000001';
    await expect(
      withWorkspaceContext(workspaceId, async (client) => {
        await client.query('SELECT 1;');
        throw new Error('Forced failure to trigger rollback');
      })
    ).rejects.toThrow('Forced failure to trigger rollback');
  });
});
