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

export interface WorkspaceMembershipSummary {
  id: string;
  slug: string;
  name: string;
  type: 'personal' | 'organization';
  role: 'owner' | 'admin' | 'contributor' | 'viewer';
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  expires_in: number;
}

export interface AuthResponse extends AuthTokens {
  user: AuthenticatedUser;
}

export interface UserMeResponse extends AuthenticatedUser {
  workspaces: WorkspaceMembershipSummary[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  type: 'access' | 'refresh';
  jti?: string;
  iat?: number;
  exp?: number;
}
