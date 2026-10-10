import type { WorkspaceMembershipSummary } from '../auth/auth.types.js';

export interface UserRecord {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserSummary {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserDetailResponse extends UserSummary {
  workspaces: WorkspaceMembershipSummary[];
}

export interface PaginatedUsersResponse {
  users: UserSummary[];
  total: number;
  limit: number;
  offset: number;
}

export interface CreateUserDTO {
  email: string;
  password: string;
  full_name: string;
  avatar_url?: string | null | undefined;
}

export interface UpdateUserDTO {
  email?: string | undefined;
  full_name?: string | undefined;
  avatar_url?: string | null | undefined;
  password?: string | undefined;
}

export interface UpdateMeDTO {
  full_name?: string | undefined;
  avatar_url?: string | null | undefined;
}

export interface ChangePasswordDTO {
  current_password: string;
  new_password: string;
}
