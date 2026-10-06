import { pool } from '../../db/pool.js';
import type { UserRecord, WorkspaceMembershipSummary } from './auth.types.js';

export interface UserSessionRecord {
  id: string;
  user_id: string;
  refresh_token_hash: string;
  is_revoked: boolean;
  expires_at: string;
}

export class AuthRepository {
  async findUserByEmail(email: string): Promise<UserRecord | null> {
    const query = `
      SELECT id, email, password_hash, full_name, avatar_url, created_at, updated_at, deleted_at
      FROM users
      WHERE LOWER(email) = LOWER($1) AND deleted_at IS NULL
      LIMIT 1;
    `;
    const result = await pool.query<UserRecord>(query, [email]);
    return result.rows[0] ?? null;
  }

  async findUserById(userId: string): Promise<UserRecord | null> {
    const query = `
      SELECT id, email, password_hash, full_name, avatar_url, created_at, updated_at, deleted_at
      FROM users
      WHERE id = $1 AND deleted_at IS NULL
      LIMIT 1;
    `;
    const result = await pool.query<UserRecord>(query, [userId]);
    return result.rows[0] ?? null;
  }

  async getUserWorkspaces(userId: string): Promise<WorkspaceMembershipSummary[]> {
    const query = `
      SELECT 
        w.id,
        w.slug,
        w.name,
        w.type,
        wm.role
      FROM workspace_members wm
      INNER JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = $1 AND w.deleted_at IS NULL
      ORDER BY wm.joined_at ASC;
    `;
    const result = await pool.query<WorkspaceMembershipSummary>(query, [userId]);
    return result.rows;
  }

  async createUserSession(params: {
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    userAgent?: string | undefined;
    ipAddress?: string | undefined;
  }): Promise<void> {
    const query = `
      INSERT INTO user_sessions (user_id, refresh_token_hash, expires_at, user_agent, ip_address)
      VALUES ($1, $2, $3, $4, $5);
    `;
    await pool.query(query, [
      params.userId,
      params.refreshTokenHash,
      params.expiresAt.toISOString(),
      params.userAgent ?? null,
      params.ipAddress ?? null,
    ]);
  }

  async findSessionByTokenHash(tokenHash: string): Promise<UserSessionRecord | null> {
    const query = `
      SELECT id, user_id, refresh_token_hash, is_revoked, expires_at
      FROM user_sessions
      WHERE refresh_token_hash = $1
      LIMIT 1;
    `;
    const result = await pool.query<UserSessionRecord>(query, [tokenHash]);
    return result.rows[0] ?? null;
  }

  async revokeSession(tokenHash: string): Promise<void> {
    const query = `
      UPDATE user_sessions
      SET is_revoked = true, updated_at = NOW()
      WHERE refresh_token_hash = $1;
    `;
    await pool.query(query, [tokenHash]);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const query = `
      UPDATE user_sessions
      SET is_revoked = true, updated_at = NOW()
      WHERE user_id = $1;
    `;
    await pool.query(query, [userId]);
  }
}

export const authRepository = new AuthRepository();
