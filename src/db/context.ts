import type pg from 'pg';
import { pool } from './pool.js';
import { logger } from '../core/logger/index.js';

export async function withSystemContext<T>(
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    return await callback(client);
  } finally {
    client.release();
  }
}

export async function withWorkspaceContext<T>(
  workspaceId: string,
  callback: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN;');
    
    // Set RLS role and workspace context for this transaction
    await client.query(`SET LOCAL ROLE momentra_app_user;`);
    await client.query(`SELECT set_config('app.current_workspace_id', $1, true);`, [workspaceId]);

    const result = await callback(client);
    await client.query('COMMIT;');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK;');
    } catch (rollbackError) {
      logger.error({ rollbackError }, 'Error during transaction rollback');
    }
    throw error;
  } finally {
    // Reset session role before returning client to pool
    try {
      await client.query('RESET ROLE;');
    } catch {
      // Ignore reset role errors if client was broken
    }
    client.release();
  }
}
