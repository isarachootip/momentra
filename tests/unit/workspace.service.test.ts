import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkspaceService } from '../../src/modules/workspaces/workspace.service.js';
import { workspaceRepository } from '../../src/modules/workspaces/workspace.repository.js';
import { authRepository } from '../../src/modules/auth/auth.repository.js';
import { ForbiddenError, ConflictError, BadRequestError } from '../../src/core/errors/app-error.js';
import type { WorkspaceRecord, WorkspaceMemberRecord } from '../../src/modules/workspaces/workspace.types.js';

describe('WorkspaceService (Unit)', () => {
  let service: WorkspaceService;

  const mockWs: WorkspaceRecord = {
    id: 'ws-1111',
    slug: 'thai-heritage',
    name: 'Thai Heritage Archive',
    type: 'organization',
    settings: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
  };

  const mockOwnerMember: WorkspaceMemberRecord = {
    id: 'wm-1',
    workspace_id: 'ws-1111',
    user_id: 'user-owner',
    role: 'owner',
    joined_at: new Date().toISOString(),
  };

  const mockAdminMember: WorkspaceMemberRecord = {
    id: 'wm-2',
    workspace_id: 'ws-1111',
    user_id: 'user-admin',
    role: 'admin',
    joined_at: new Date().toISOString(),
  };

  const mockViewerMember: WorkspaceMemberRecord = {
    id: 'wm-3',
    workspace_id: 'ws-1111',
    user_id: 'user-viewer',
    role: 'viewer',
    joined_at: new Date().toISOString(),
  };

  beforeEach(() => {
    service = new WorkspaceService();
    vi.restoreAllMocks();
  });

  it('should list all workspaces accessible to user', async () => {
    vi.spyOn(workspaceRepository, 'getUserWorkspaces').mockResolvedValue([{ ...mockWs, role: 'owner' }]);
    const res = await service.listUserWorkspaces('user-owner');
    expect(res).toHaveLength(1);
    expect(res[0]!.name).toBe('Thai Heritage Archive');
  });

  it('should create workspace and assign creator as owner', async () => {
    vi.spyOn(workspaceRepository, 'findWorkspaceBySlug').mockResolvedValue(null);
    vi.spyOn(workspaceRepository, 'createWorkspace').mockResolvedValue(mockWs);
    vi.spyOn(workspaceRepository, 'addWorkspaceMember').mockResolvedValue(mockOwnerMember);

    const res = await service.createWorkspace('user-owner', {
      name: 'Thai Heritage Archive',
      slug: 'thai-heritage',
    });

    expect(res.role).toBe('owner');
    expect(workspaceRepository.addWorkspaceMember).toHaveBeenCalledWith(mockWs.id, 'user-owner', 'owner');
  });

  it('should allow owner or admin to update workspace', async () => {
    vi.spyOn(workspaceRepository, 'getWorkspaceMember').mockResolvedValue(mockAdminMember);
    vi.spyOn(workspaceRepository, 'updateWorkspace').mockResolvedValue({ ...mockWs, name: 'Updated' });

    const res = await service.updateWorkspace(mockWs.id, 'user-admin', { name: 'Updated' });
    expect(res.name).toBe('Updated');
  });

  it('should forbid viewer from updating workspace', async () => {
    vi.spyOn(workspaceRepository, 'getWorkspaceMember').mockResolvedValue(mockViewerMember);
    await expect(service.updateWorkspace(mockWs.id, 'user-viewer', { name: 'Updated' })).rejects.toThrow(ForbiddenError);
  });

  it('should forbid non-owner from deleting workspace', async () => {
    vi.spyOn(workspaceRepository, 'getWorkspaceMember').mockResolvedValue(mockAdminMember);
    await expect(service.deleteWorkspace(mockWs.id, 'user-admin')).rejects.toThrow(ForbiddenError);
  });

  it('should invite an existing user and add them to workspace', async () => {
    vi.spyOn(workspaceRepository, 'getWorkspaceMember').mockResolvedValueOnce(mockAdminMember);
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue({
      id: 'user-invited',
      email: 'invited@test.com',
      password_hash: 'hash',
      full_name: 'Invited User',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });
    vi.spyOn(workspaceRepository, 'getWorkspaceMember').mockResolvedValueOnce(null);
    vi.spyOn(workspaceRepository, 'addWorkspaceMember').mockResolvedValue({
      id: 'wm-99',
      workspace_id: mockWs.id,
      user_id: 'user-invited',
      role: 'contributor',
      joined_at: new Date().toISOString(),
    });

    const res = await service.inviteMember(mockWs.id, 'user-admin', { email: 'invited@test.com', role: 'contributor' });
    expect(res.user_id).toBe('user-invited');
    expect(res.role).toBe('contributor');
  });

  it('should reject inviting someone who is already a member', async () => {
    vi.spyOn(workspaceRepository, 'getWorkspaceMember').mockResolvedValueOnce(mockAdminMember);
    vi.spyOn(authRepository, 'findUserByEmail').mockResolvedValue({
      id: 'user-existing',
      email: 'existing@test.com',
      password_hash: 'hash',
      full_name: 'Existing',
      avatar_url: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    });
    vi.spyOn(workspaceRepository, 'getWorkspaceMember').mockResolvedValueOnce(mockViewerMember);

    await expect(
      service.inviteMember(mockWs.id, 'user-admin', { email: 'existing@test.com', role: 'viewer' })
    ).rejects.toThrow(ConflictError);
  });

  it('should forbid admin from modifying owner role', async () => {
    vi.spyOn(workspaceRepository, 'getWorkspaceMember').mockResolvedValueOnce(mockAdminMember); // requester
    vi.spyOn(workspaceRepository, 'getWorkspaceMember').mockResolvedValueOnce(mockOwnerMember); // target
    await expect(
      service.updateMemberRole(mockWs.id, 'user-admin', 'user-owner', 'viewer')
    ).rejects.toThrow(ForbiddenError);
  });

  it('should prevent demoting the only owner', async () => {
    vi.spyOn(workspaceRepository, 'getWorkspaceMember').mockResolvedValueOnce(mockOwnerMember); // requester
    vi.spyOn(workspaceRepository, 'getWorkspaceMember').mockResolvedValueOnce(mockOwnerMember); // target
    vi.spyOn(workspaceRepository, 'countWorkspaceOwners').mockResolvedValue(1);

    await expect(
      service.updateMemberRole(mockWs.id, 'user-owner', 'user-owner', 'admin')
    ).rejects.toThrow(BadRequestError);
  });
});
