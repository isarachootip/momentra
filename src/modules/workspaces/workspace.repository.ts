import { pool } from '../../db/pool.js';
import type {
  WorkspaceRecord,
  WorkspaceResponse,
  WorkspaceMemberRecord,
  WorkspaceMemberResponse,
  WorkspaceRole,
  WorkspaceType,
} from './workspace.types.js';

export class WorkspaceRepository {
  async getUserWorkspaces(userId: string): Promise<WorkspaceResponse[]> {
    const query = `
      SELECT 
        w.id, w.slug, w.name, w.type, wm.role, w.settings, w.created_at, w.updated_at
      FROM workspace_members wm
      INNER JOIN workspaces w ON w.id = wm.workspace_id
      WHERE wm.user_id = $1 AND w.deleted_at IS NULL
      ORDER BY wm.joined_at ASC;
    `;
    const result = await pool.query<WorkspaceResponse>(query, [userId]);
    return result.rows;
  }

  async getWorkspaceById(workspaceId: string): Promise<WorkspaceRecord | null> {
    const query = `
      SELECT id, slug, name, type, settings, created_at, updated_at, deleted_at
      FROM workspaces
      WHERE id = $1 AND deleted_at IS NULL
      LIMIT 1;
    `;
    const result = await pool.query<WorkspaceRecord>(query, [workspaceId]);
    return result.rows[0] ?? null;
  }

  async findWorkspaceBySlug(slug: string): Promise<WorkspaceRecord | null> {
    const query = `
      SELECT id, slug, name, type, settings, created_at, updated_at, deleted_at
      FROM workspaces
      WHERE slug = $1 AND deleted_at IS NULL
      LIMIT 1;
    `;
    const result = await pool.query<WorkspaceRecord>(query, [slug]);
    return result.rows[0] ?? null;
  }

  async createWorkspace(data: {
    slug: string;
    name: string;
    type: WorkspaceType;
    settings: Record<string, unknown>;
  }): Promise<WorkspaceRecord> {
    const query = `
      INSERT INTO workspaces (slug, name, type, settings)
      VALUES ($1, $2, $3, $4)
      RETURNING id, slug, name, type, settings, created_at, updated_at, deleted_at;
    `;
    const result = await pool.query<WorkspaceRecord>(query, [
      data.slug,
      data.name,
      data.type,
      JSON.stringify(data.settings),
    ]);
    return result.rows[0]!;
  }

  async updateWorkspace(
    workspaceId: string,
    data: { name?: string | undefined; settings?: Record<string, unknown> | undefined }
  ): Promise<WorkspaceRecord | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${idx++}`);
      values.push(data.name);
    }
    if (data.settings !== undefined) {
      updates.push(`settings = $${idx++}`);
      values.push(JSON.stringify(data.settings));
    }

    if (updates.length === 0) {
      return this.getWorkspaceById(workspaceId);
    }

    values.push(workspaceId);
    const query = `
      UPDATE workspaces
      SET ${updates.join(', ')}, updated_at = NOW()
      WHERE id = $${idx} AND deleted_at IS NULL
      RETURNING id, slug, name, type, settings, created_at, updated_at, deleted_at;
    `;
    const result = await pool.query<WorkspaceRecord>(query, values);
    return result.rows[0] ?? null;
  }

  async softDeleteWorkspace(workspaceId: string): Promise<void> {
    const query = `
      UPDATE workspaces
      SET deleted_at = NOW(), updated_at = NOW()
      WHERE id = $1 AND deleted_at IS NULL;
    `;
    await pool.query(query, [workspaceId]);
  }

  async getWorkspaceMember(
    workspaceId: string,
    userId: string
  ): Promise<WorkspaceMemberRecord | null> {
    const query = `
      SELECT id, workspace_id, user_id, role, joined_at
      FROM workspace_members
      WHERE workspace_id = $1 AND user_id = $2
      LIMIT 1;
    `;
    const result = await pool.query<WorkspaceMemberRecord>(query, [workspaceId, userId]);
    return result.rows[0] ?? null;
  }

  async listWorkspaceMembers(workspaceId: string): Promise<WorkspaceMemberResponse[]> {
    const query = `
      SELECT 
        wm.user_id,
        u.email,
        u.full_name,
        u.avatar_url,
        wm.role,
        wm.joined_at
      FROM workspace_members wm
      INNER JOIN users u ON u.id = wm.user_id
      WHERE wm.workspace_id = $1 AND u.deleted_at IS NULL
      ORDER BY 
        CASE wm.role 
          WHEN 'owner' THEN 1 
          WHEN 'admin' THEN 2 
          WHEN 'contributor' THEN 3 
          ELSE 4 
        END,
        wm.joined_at ASC;
    `;
    const result = await pool.query<WorkspaceMemberResponse>(query, [workspaceId]);
    return result.rows;
  }

  async addWorkspaceMember(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ): Promise<WorkspaceMemberRecord> {
    const query = `
      INSERT INTO workspace_members (workspace_id, user_id, role)
      VALUES ($1, $2, $3)
      RETURNING id, workspace_id, user_id, role, joined_at;
    `;
    const result = await pool.query<WorkspaceMemberRecord>(query, [workspaceId, userId, role]);
    return result.rows[0]!;
  }

  async updateWorkspaceMemberRole(
    workspaceId: string,
    userId: string,
    role: WorkspaceRole
  ): Promise<void> {
    const query = `
      UPDATE workspace_members
      SET role = $3
      WHERE workspace_id = $1 AND user_id = $2;
    `;
    await pool.query(query, [workspaceId, userId, role]);
  }

  async removeWorkspaceMember(workspaceId: string, userId: string): Promise<void> {
    const query = `
      DELETE FROM workspace_members
      WHERE workspace_id = $1 AND user_id = $2;
    `;
    await pool.query(query, [workspaceId, userId]);
  }

  async countWorkspaceOwners(workspaceId: string): Promise<number> {
    const query = `
      SELECT COUNT(*)::int as count
      FROM workspace_members
      WHERE workspace_id = $1 AND role = 'owner';
    `;
    const result = await pool.query<{ count: number }>(query, [workspaceId]);
    return result.rows[0]?.count ?? 0;
  }
}

export const workspaceRepository = new WorkspaceRepository();
