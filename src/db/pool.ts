import pg from 'pg';
import { env } from '../config/env.js';
import { logger } from '../core/logger/index.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_SSL ? { rejectUnauthorized: false } : false,
  max: env.DATABASE_MAX_CONNECTIONS,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 15000,
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected error on idle PostgreSQL client');
});

export interface DatabaseHealth {
  healthy: boolean;
  latencyMs: number;
  error?: string;
}

export async function checkDatabaseConnection(): Promise<DatabaseHealth> {
  const start = performance.now();
  try {
    const res = await pool.query('SELECT 1 AS alive;');
    const latencyMs = Math.round(performance.now() - start);
    return {
      healthy: res.rowCount === 1,
      latencyMs,
    };
  } catch (err) {
    const latencyMs = Math.round(performance.now() - start);
    const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
    return {
      healthy: false,
      latencyMs,
      error: errorMessage,
    };
  }
}

export async function closeDatabasePool(): Promise<void> {
  await pool.end();
}
