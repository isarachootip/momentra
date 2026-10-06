import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from '../../src/modules/auth/auth.service.js';
import { authRepository } from '../../src/modules/auth/auth.repository.js';
import { tokenService } from '../../src/core/security/token-service.js';
import { passwordService } from '../../src/core/security/password-service.js';
import { UnauthorizedError, NotFoundError } from '../../src/core/errors/app-error.js';
import type { UserRecord, WorkspaceMembershipSummary } from '../../src/modules/auth/auth.types.js';

describe('AuthService (Unit)', () => {
  let service: AuthService;

  const mockUser: UserRecord = {
    id: 'user-uuid-1234',
    email: 'somchai@momentra.app',
    password_hash: 'scrypt:salt:key',
    full_name: 'สมชาย วิจิตรานันท์',
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  const mockWorkspaces: WorkspaceMembershipSummary[] = [
    {
      id: 'ws-1',
      slug: 'personal',
      name: 'Personal Collection',
      type: 'personal',
      role: 'owner',
    },
  ];

  beforeEach(() => {
    service = new AuthService();
    vi.restoreAllMocks();
  });

  it('should authenticate user successfully with valid credentials', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(mockUser);
    vi.spyOn(passwordService, 'verifyPassword').mockResolvedValue(true);
    vi.spyOn(authRepository, 'createUserSession').mockResolvedValue();

    const response = await service.login({
      provider: 'local',
      email: 'somchai@momentra.app',
      password: 'Password123!',
    });

    expect(response.access_token).toBeDefined();
    expect(response.refresh_token).toBeDefined();
    expect(response.token_type).toBe('Bearer');
    expect(response.user.email).toBe('somchai@momentra.app');
    expect(response.user.full_name).toBe('สมชาย วิจิตรานันท์');
  });

  it('should throw UnauthorizedError when user is not found', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);

    await expect(
      service.login({
        provider: 'local',
        email: 'unknown@momentra.app',
        password: 'Password123!',
      })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should throw UnauthorizedError when password does not match', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(mockUser);
    vi.spyOn(passwordService, 'verifyPassword').mockResolvedValue(false);

    await expect(
      service.login({
        provider: 'local',
        email: 'somchai@momentra.app',
        password: 'WrongPassword',
      })
    ).rejects.toThrow(UnauthorizedError);
  });

  it('should rotate tokens and create new session upon refresh', async () => {
    const { tokens } = tokenService.generateTokenPair(mockUser.id, mockUser.email);
    const tokenHash = tokenService.hashToken(tokens.refresh_token);

    vi.spyOn(authRepository, 'findSessionByTokenHash').mockResolvedValue({
      id: 'session-1',
      user_id: mockUser.id,
      refresh_token_hash: tokenHash,
      is_revoked: false,
      expires_at: new Date(Date.now() + 10000).toISOString(),
    });

    const revokeSessionSpy = vi.spyOn(authRepository, 'revokeSession').mockResolvedValue();
    const createSessionSpy = vi.spyOn(authRepository, 'createUserSession').mockResolvedValue();

    const newTokens = await service.refreshToken(tokens.refresh_token);

    expect(newTokens.access_token).toBeDefined();
    expect(newTokens.refresh_token).toBeDefined();
    expect(revokeSessionSpy).toHaveBeenCalledWith(tokenHash);
    expect(createSessionSpy).toHaveBeenCalled();
  });

  it('should detect token reuse and revoke ALL sessions of the user', async () => {
    const { tokens } = tokenService.generateTokenPair(mockUser.id, mockUser.email);
    const tokenHash = tokenService.hashToken(tokens.refresh_token);

    vi.spyOn(authRepository, 'findSessionByTokenHash').mockResolvedValue({
      id: 'session-revoked',
      user_id: mockUser.id,
      refresh_token_hash: tokenHash,
      is_revoked: true, // Already revoked! Reuse detected!
      expires_at: new Date().toISOString(),
    });

    const revokeAllSpy = vi.spyOn(authRepository, 'revokeAllUserSessions').mockResolvedValue();

    await expect(service.refreshToken(tokens.refresh_token)).rejects.toThrow(
      'Refresh token was revoked or reused'
    );
    expect(revokeAllSpy).toHaveBeenCalledWith(mockUser.id);
  });

  it('should return user profile and workspaces on getCurrentUser', async () => {
    vi.spyOn(authRepository, 'findUserById').mockResolvedValue(mockUser);
    vi.spyOn(authRepository, 'getUserWorkspaces').mockResolvedValue(mockWorkspaces);

    const me = await service.getCurrentUser(mockUser.id);

    expect(me.id).toBe(mockUser.id);
    expect(me.email).toBe(mockUser.email);
    expect(me.workspaces).toHaveLength(1);
    expect(me.workspaces[0]!.name).toBe('Personal Collection');
    expect(me.workspaces[0]!.role).toBe('owner');
  });

  it('should throw NotFoundError if user does not exist in getCurrentUser', async () => {
    vi.spyOn(authRepository, 'findUserById').mockResolvedValue(null);

    await expect(service.getCurrentUser('non-existent-id')).rejects.toThrow(NotFoundError);
  });

  it('should authenticate user with OIDC id_token', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(mockUser);
    vi.spyOn(authRepository, 'createUserSession').mockResolvedValue();

    const response = await service.login({
      provider: 'oidc',
      id_token: 'somchai@momentra.app',
    });

    expect(response.access_token).toBeDefined();
    expect(response.user.email).toBe('somchai@momentra.app');
  });

  it('should throw UnauthorizedError when OIDC user does not exist', async () => {
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue(null);

    await expect(
      service.login({
        provider: 'oidc',
        id_token: 'notfound@momentra.app',
      })
    ).rejects.toThrow('OIDC account not linked to an existing Momentra user');
  });

  it('should revoke session on logout if refresh token is provided', async () => {
    const revokeSpy = vi.spyOn(authRepository, 'revokeSession').mockResolvedValue();
    await service.logout('some-refresh-token');
    expect(revokeSpy).toHaveBeenCalled();
  });
});
