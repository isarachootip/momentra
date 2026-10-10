import { pool } from '../../db/pool.js';
import type { WorkspaceMembershipSummary } from '../auth/auth.types.js';
import type { UserRecord, UserSummary } from './user.types.js';

export class UserRepository {
  async listUsers(query: {
    search?: string | undefined;
    limit: number;
    offset: number;
    includeDeleted?: boolean | undefined;
  }): Promise<UserSummary[]> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (!query.includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

    if (query.search) {
      conditions.push(`(full_name ILIKE $${idx} OR email ILIKE $${idx})`);
      values.push(`%${query.search}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    values.push(query.limit, query.offset);

    const sql = `
      SELECT id, email, full_name, avatar_url, created_at, updated_at, deleted_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${idx++} OFFSET $${idx++};
    `;

    const result = await pool.query<UserSummary>(sql, values);
    return result.rows;
  }

  async countUsers(query: {
    search?: string | undefined;
    includeDeleted?: boolean | undefined;
  }): Promise<number> {
    const conditions: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (!query.includeDeleted) {
      conditions.push('deleted_at IS NULL');
    }

    if (query.search) {
      conditions.push(`(full_name ILIKE $${idx} OR email ILIKE $${idx})`);
      values.push(`%${query.search}%`);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT COUNT(*)::int as count FROM users ${whereClause};`;
    const result = await pool.query<{ count: number }>(sql, values);
    return result.rows[0]?.count ?? 0;
  }

  async findUserById(userId: string, includeDeleted = false): Promise<UserRecord | null> {
    const query = `
      SELECT id, email, password_hash, full_name, avatar_url, created_at, updated_at, deleted_at
      FROM users
      WHERE id = $1 ${includeDeleted ? '' : 'AND deleted_at IS NULL'}
      LIMIT 1;
    `;
    const result = await pool.query<UserRecord>(query, [userId]);
    return result.rows[0] ?? null;
  }

  async findUserByEmail(email: string, includeDeleted = false): Promise<UserRecord | null> {
    const query = `
      SELECT id, email, password_hash, full_name, avatar_url, created_at, updated_at, deleted_at
      FROM users
      WHERE LOWER(email) = LOWER($1) ${includeDeleted ? '' : 'AND deleted_at IS NULL'}
      LIMIT 1;
    `;
    const result = await pool.query<UserRecord>(query, [email]);
    return result.rows[0] ?? null;
  }

  async createUser(data: {
    email: string;
    password_hash: string;
    full_name: string;
    avatar_url?: string | null | undefined;
  }): Promise<UserRecord> {
    const query = `
      INSERT INTO users (email, password_hash, full_name, avatar_url)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, password_hash, full_name, avatar_url, created_at, updated_at, deleted_at;
    `;
    const result = await pool.query<UserRecord>(query, [
      data.email,
      data.password_hash,
      data.full_name,
      data.avatar_url ?? null,
    ]);
    return result.rows[0]!;
  }

  async updateUser(
    userId: string,
    data: {
      email?: string | undefined;
      full_name?: string | undefined;
      avatar_url?: string | null | undefined;
      password_hash?: string | undefined;
    }
  ): Promise<UserRecord | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.email !== undefined) {
      updates.push(`email = $${idx++}`);
      values.push(data.email);
    }
    if (data.full_name !== undefined) {
      updates.push(`full_name = $${idx++}`);
      values.push(data.full_name);
    }
    if (data.avatar_url !== undefined) {
      updates.push(`avatar_url = $${idx++}`);
      values.push(data.avatar_url);
    }
    if (data.password_hash !== undefined) {
      updates.push(`password_hash = $${idx++}`);
      values.push(data.password_hash);
    }

    if (updates.length === 0) {
      return this.findUserById(userId);
    }

    values.push(userId);
    const query = `
      UPDATE users
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${idx} AND deleted_at IS NULL
      RETURNING id, email, password_hash, full_name, avatar_url, created_at, updated_at, deleted_at;
    `;
    const result = await pool.query<UserRecord>(query, values);
    return result.rows[0] ?? null;
  }

  async softDeleteUser(userId: string): Promise<void> {
    const query = `
      UPDATE users
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL;
    `;
    await pool.query(query, [userId]);
  }

  async revokeAllUserSessions(userId: string): Promise<void> {
    const query = `
      UPDATE user_sessions
      SET is_revoked = true, updated_at = NOW()
      WHERE user_id = $1;
    `;
    await pool.query(query, [userId]);
  }

  async getUserWorkspaces(userId: string): Promise<WorkspaceMembershipSummary[]> {
    const query = `
      SELECT 
        w.id, w.slug, w.name, w.type, wm.role
      FROM workspace_members wm
      INNER JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = $1 AND w.deleted_at IS NULL
      ORDER BY wm.joined_at ASC;
    `;
    const result = await pool.query<WorkspaceMembershipSummary>(query, [userId]);
    return result.rows;
  }
}

export const userRepository = new UserRepository();
