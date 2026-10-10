import { workspaceRepository } from './workspace.repository.js';
import { authRepository } from '../auth/auth.repository.js';
import { passwordService } from '../../core/security/password-service.js';
import {
  NotFoundError,
  ForbiddenError,
  ConflictError,
  BadRequestError,
} from '../../core/errors/app-error.js';
import type {
  WorkspaceResponse,
  WorkspaceMemberResponse,
  CreateWorkspaceDTO,
  UpdateWorkspaceDTO,
  InviteMemberDTO,
  WorkspaceRole,
} from './workspace.types.js';

export class WorkspaceService {
  async listUserWorkspaces(userId: string): Promise<WorkspaceResponse[]> {
    return workspaceRepository.getUserWorkspaces(userId);
  }

  async getWorkspace(workspaceId: string, userId: string): Promise<WorkspaceResponse> {
    const member = await workspaceRepository.getWorkspaceMember(workspaceId, userId);
    if (!member) {
      throw new NotFoundError('Workspace not found or access denied');
    }
    const ws = await workspaceRepository.getWorkspaceById(workspaceId);
    if (!ws) {
      throw new NotFoundError('Workspace not found');
    }
    return { ...ws, role: member.role };
  }

  async createWorkspace(userId: string, input: CreateWorkspaceDTO): Promise<WorkspaceResponse> {
    const baseSlug = input.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    let slug = baseSlug || 'workspace';
    
    // Ensure slug uniqueness
    const existing = await workspaceRepository.findWorkspaceBySlug(slug);
    if (existing) {
      slug = `${slug}-${Date.now().toString(36)}`;
    }

    const ws = await workspaceRepository.createWorkspace({
      slug,
      name: input.name,
      type: input.type ?? 'organization',
      settings: input.settings ?? {},
    });

    await workspaceRepository.addWorkspaceMember(ws.id, userId, 'owner');
    return { ...ws, role: 'owner' };
  }

  async updateWorkspace(
    workspaceId: string,
    userId: string,
    input: UpdateWorkspaceDTO
  ): Promise<WorkspaceResponse> {
    const member = await workspaceRepository.getWorkspaceMember(workspaceId, userId);
    if (!member || (member.role !== 'owner' && member.role !== 'admin')) {
      throw new ForbiddenError('Only workspace owners or admins can update workspace settings');
    }

    const updated = await workspaceRepository.updateWorkspace(workspaceId, input);
    if (!updated) {
      throw new NotFoundError('Workspace not found');
    }
    return { ...updated, role: member.role };
  }

  async deleteWorkspace(workspaceId: string, userId: string): Promise<void> {
    const member = await workspaceRepository.getWorkspaceMember(workspaceId, userId);
    if (!member || member.role !== 'owner') {
      throw new ForbiddenError('Only the workspace owner can delete the workspace');
    }
    await workspaceRepository.softDeleteWorkspace(workspaceId);
  }

  async listMembers(workspaceId: string, userId: string): Promise<WorkspaceMemberResponse[]> {
    const member = await workspaceRepository.getWorkspaceMember(workspaceId, userId);
    if (!member) {
      throw new ForbiddenError('You are not a member of this workspace');
    }
    return workspaceRepository.listWorkspaceMembers(workspaceId);
  }

  async inviteMember(
    workspaceId: string,
    requesterId: string,
    input: InviteMemberDTO
  ): Promise<WorkspaceMemberResponse> {
    const requester = await workspaceRepository.getWorkspaceMember(workspaceId, requesterId);
    if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
      throw new ForbiddenError('Only workspace owners or admins can invite new members');
    }

    let targetUser = await authRepository.findUserByEmail(input.email);
    if (!targetUser) {
      // Auto-provision initial invited user account
      const tempPassword = `Invited!${Math.random().toString(36).substring(2, 10)}`;
      const passwordHash = await passwordService.hashPassword(tempPassword);
      const emailName = input.email.split('@')[0] ?? 'User';
      
      const insertQuery = `
        INSERT INTO users (email, password_hash, full_name)
        VALUES ($1, $2, $3)
        RETURNING id, email, password_hash, full_name, avatar_url, created_at, updated_at, deleted_at;
      `;
      const { pool } = await import('../../db/pool.js');
      const res = await pool.query(insertQuery, [input.email, passwordHash, emailName]);
      targetUser = res.rows[0];
    }

    const existingMembership = await workspaceRepository.getWorkspaceMember(workspaceId, targetUser!.id);
    if (existingMembership) {
      throw new ConflictError('User is already a member of this workspace');
    }

    const membership = await workspaceRepository.addWorkspaceMember(
      workspaceId,
      targetUser!.id,
      input.role
    );

    return {
      user_id: targetUser!.id,
      email: targetUser!.email,
      full_name: targetUser!.full_name,
      avatar_url: targetUser!.avatar_url,
      role: membership.role,
      joined_at: membership.joined_at,
    };
  }

  async updateMemberRole(
    workspaceId: string,
    requesterId: string,
    targetUserId: string,
    newRole: WorkspaceRole
  ): Promise<WorkspaceMemberResponse> {
    const requester = await workspaceRepository.getWorkspaceMember(workspaceId, requesterId);
    if (!requester || (requester.role !== 'owner' && requester.role !== 'admin')) {
      throw new ForbiddenError('Only owners or admins can modify member roles');
    }

    const target = await workspaceRepository.getWorkspaceMember(workspaceId, targetUserId);
    if (!target) {
      throw new NotFoundError('Member not found in this workspace');
    }

    if (requester.role === 'admin') {
      if (target.role === 'owner' || newRole === 'owner') {
        throw new ForbiddenError('Admins cannot modify owner roles or grant ownership');
      }
    }

    if (target.role === 'owner' && newRole !== 'owner') {
      const ownerCount = await workspaceRepository.countWorkspaceOwners(workspaceId);
      if (ownerCount <= 1) {
        throw new BadRequestError('Cannot demote the only owner of a workspace');
      }
    }

    await workspaceRepository.updateWorkspaceMemberRole(workspaceId, targetUserId, newRole);
    const members = await workspaceRepository.listWorkspaceMembers(workspaceId);
    const updated = members.find((m) => m.user_id === targetUserId);
    if (!updated) {
      throw new NotFoundError('Updated member record not found');
    }
    return updated;
  }

  async removeMember(
    workspaceId: string,
    requesterId: string,
    targetUserId: string
  ): Promise<void> {
    const requester = await workspaceRepository.getWorkspaceMember(workspaceId, requesterId);
    if (!requester) {
      throw new ForbiddenError('You are not a member of this workspace');
    }

    const isSelf = requesterId === targetUserId;
    if (!isSelf && requester.role !== 'owner' && requester.role !== 'admin') {
      throw new ForbiddenError('Only owners or admins can remove members');
    }

    const target = await workspaceRepository.getWorkspaceMember(workspaceId, targetUserId);
    if (!target) {
      throw new NotFoundError('Member not found in this workspace');
    }

    if (!isSelf && requester.role === 'admin' && target.role === 'owner') {
      throw new ForbiddenError('Admins cannot remove the workspace owner');
    }

    if (target.role === 'owner') {
      const ownerCount = await workspaceRepository.countWorkspaceOwners(workspaceId);
      if (ownerCount <= 1) {
        throw new BadRequestError('Cannot remove the only owner of a workspace');
      }
    }

    await workspaceRepository.removeWorkspaceMember(workspaceId, targetUserId);
  }
}

export const workspaceService = new WorkspaceService();
