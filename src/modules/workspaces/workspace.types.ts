export type WorkspaceRole = 'owner' | 'admin' | 'contributor' | 'viewer';
export type WorkspaceType = 'personal' | 'organization';

export interface WorkspaceRecord {
  id: string;
  slug: string;
  name: string;
  type: WorkspaceType;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WorkspaceResponse {
  id: string;
  slug: string;
  name: string;
  type: WorkspaceType;
  role?: WorkspaceRole;
  settings?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface WorkspaceMemberRecord {
  id: string;
  workspace_id: string;
  user_id: string;
  role: WorkspaceRole;
  joined_at: string;
}

export interface WorkspaceMemberResponse {
  user_id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: WorkspaceRole;
  joined_at: string;
}

export interface CreateWorkspaceDTO {
  name: string;
  slug?: string | undefined;
  type?: WorkspaceType | undefined;
  settings?: Record<string, unknown> | undefined;
}

export interface UpdateWorkspaceDTO {
  name?: string | undefined;
  settings?: Record<string, unknown> | undefined;
}

export interface InviteMemberDTO {
  email: string;
  role: 'admin' | 'contributor' | 'viewer';
}

export interface UpdateMemberRoleDTO {
  role: WorkspaceRole;
}
