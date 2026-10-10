import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserService } from '../../src/modules/users/user.service.js';
import { userRepository } from '../../src/modules/users/user.repository.js';
import { workspaceRepository } from '../../src/modules/workspaces/workspace.repository.js';
import { passwordService } from '../../src/core/security/password-service.js';
import { ConflictError, UnauthorizedError } from '../../src/core/errors/app-error.js';
import type { UserRecord } from '../../src/modules/users/user.types.js';

describe('UserService (Unit)', () => {
  let service: UserService;

  const mockUser: UserRecord = {
    id: 'user-123',
    email: 'test@momentra.app',
    password_hash: 'scrypt:salt:hash',
    full_name: 'Somchai Jaidee',
    avatar_url: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  beforeEach(() => {
    service = new UserService();
    vi.restoreAllMocks();
  });

  it('should list users with pagination metadata', async () => {
    vi.spyOn(userRepository, 'listUsers').mockResolvedValue([mockUser]);
    vi.spyOn(userRepository, 'countUsers').mockResolvedValue(1);

    const res = await service.listUsers({ limit: 10, offset: 0, include_deleted: false });
    expect(res.users).toHaveLength(1);
    expect(res.total).toBe(1);
    expect(res.limit).toBe(10);
  });

  it('should get user by id with memberships', async () => {
    vi.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
    vi.spyOn(userRepository, 'getUserWorkspaces').mockResolvedValue([
      { id: 'ws-1', slug: 'main', name: 'Main', type: 'personal', role: 'owner' },
    ]);

    const res = await service.getUserById('user-123');
    expect(res.email).toBe('test@momentra.app');
    expect(res.workspaces).toHaveLength(1);
  });

  it('should create user and default personal workspace', async () => {
    vi.spyOn(userRepository, 'findUserByEmail').mockResolvedValue(null);
    vi.spyOn(passwordService, 'hashPassword').mockResolvedValue('scrypt:hashed');
    vi.spyOn(userRepository, 'createUser').mockResolvedValue(mockUser);
    vi.spyOn(workspaceRepository, 'createWorkspace').mockResolvedValue({
      id: 'ws-new',
      slug: 'test-personal',
      name: "Somchai Jaidee's Workspace",
      type: 'personal',
      settings: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });
    vi.spyOn(workspaceRepository, 'addWorkspaceMember').mockResolvedValue({
      id: 'wm-new',
      workspace_id: 'ws-new',
      user_id: mockUser.id,
      role: 'owner',
      joined_at: new Date().toISOString(),
    });
    vi.spyOn(userRepository, 'getUserWorkspaces').mockResolvedValue([
      { id: 'ws-new', slug: 'test-personal', name: "Somchai Jaidee's Workspace", type: 'personal', role: 'owner' },
    ]);

    const res = await service.createUser({
      email: 'test@momentra.app',
      password: 'Password123!',
      full_name: 'Somchai Jaidee',
    });

    expect(res.id).toBe('user-123');
    expect(workspaceRepository.createWorkspace).toHaveBeenCalled();
  });

  it('should prevent creating user with duplicate email', async () => {
    vi.spyOn(userRepository, 'findUserByEmail').mockResolvedValue(mockUser);

    await expect(
      service.createUser({
        email: 'test@momentra.app',
        password: 'Password123!',
        full_name: 'Somchai Jaidee',
      })
    ).rejects.toThrow(ConflictError);
  });

  it('should soft delete user and revoke all sessions', async () => {
    vi.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
    vi.spyOn(userRepository, 'softDeleteUser').mockResolvedValue();
    vi.spyOn(userRepository, 'revokeAllUserSessions').mockResolvedValue();

    await service.deleteUser('user-123');
    expect(userRepository.softDeleteUser).toHaveBeenCalledWith('user-123');
    expect(userRepository.revokeAllUserSessions).toHaveBeenCalledWith('user-123');
  });

  it('should verify password and update to new password', async () => {
    vi.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
    vi.spyOn(passwordService, 'verifyPassword').mockResolvedValue(true);
    vi.spyOn(passwordService, 'hashPassword').mockResolvedValue('scrypt:newhash');
    vi.spyOn(userRepository, 'updateUser').mockResolvedValue(mockUser);
    vi.spyOn(userRepository, 'revokeAllUserSessions').mockResolvedValue();

    await service.changePassword('user-123', {
      current_password: 'OldPassword123!',
      new_password: 'NewPassword123!',
    });

    expect(userRepository.updateUser).toHaveBeenCalledWith('user-123', { password_hash: 'scrypt:newhash' });
    expect(userRepository.revokeAllUserSessions).toHaveBeenCalledWith('user-123');
  });

  it('should throw UnauthorizedError when current password is wrong', async () => {
    vi.spyOn(userRepository, 'findUserById').mockResolvedValue(mockUser);
    vi.spyOn(passwordService, 'verifyPassword').mockResolvedValue(false);

    await expect(
      service.changePassword('user-123', {
        current_password: 'WrongPassword!',
        new_password: 'NewPassword123!',
      })
    ).rejects.toThrow(UnauthorizedError);
  });
});
