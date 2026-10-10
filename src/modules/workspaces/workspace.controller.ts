import type { FastifyRequest, FastifyReply } from 'fastify';
import { workspaceService } from './workspace.service.js';
import {
  createWorkspaceSchema,
  updateWorkspaceSchema,
  inviteMemberSchema,
  updateMemberRoleSchema,
  workspaceIdParamSchema,
  memberParamSchema,
} from './workspace.schemas.js';
import { UnauthorizedError } from '../../core/errors/app-error.js';

export class WorkspaceController {
  private getUserId(request: FastifyRequest): string {
    if (!request.user?.id) {
      throw new UnauthorizedError('User authentication context not found');
    }
    return request.user.id;
  }

  async listWorkspaces(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = this.getUserId(request);
    const workspaces = await workspaceService.listUserWorkspaces(userId);
    reply.status(200).send(workspaces);
  }

  async createWorkspace(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = this.getUserId(request);
    const input = createWorkspaceSchema.parse(request.body);
    const workspace = await workspaceService.createWorkspace(userId, input);
    reply.status(201).send(workspace);
  }

  async getWorkspace(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = this.getUserId(request);
    const { id } = workspaceIdParamSchema.parse(request.params);
    const workspace = await workspaceService.getWorkspace(id, userId);
    reply.status(200).send(workspace);
  }

  async updateWorkspace(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = this.getUserId(request);
    const { id } = workspaceIdParamSchema.parse(request.params);
    const input = updateWorkspaceSchema.parse(request.body);
    const updated = await workspaceService.updateWorkspace(id, userId, input);
    reply.status(200).send(updated);
  }

  async deleteWorkspace(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = this.getUserId(request);
    const { id } = workspaceIdParamSchema.parse(request.params);
    await workspaceService.deleteWorkspace(id, userId);
    reply.status(204).send();
  }

  async listMembers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = this.getUserId(request);
    const { id } = workspaceIdParamSchema.parse(request.params);
    const members = await workspaceService.listMembers(id, userId);
    reply.status(200).send(members);
  }

  async inviteMember(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = this.getUserId(request);
    const { id } = workspaceIdParamSchema.parse(request.params);
    const input = inviteMemberSchema.parse(request.body);
    const member = await workspaceService.inviteMember(id, userId, input);
    reply.status(201).send(member);
  }

  async updateMemberRole(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = this.getUserId(request);
    const { id, userId: targetUserId } = memberParamSchema.parse(request.params);
    const input = updateMemberRoleSchema.parse(request.body);
    const member = await workspaceService.updateMemberRole(id, userId, targetUserId, input.role);
    reply.status(200).send(member);
  }

  async removeMember(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = this.getUserId(request);
    const { id, userId: targetUserId } = memberParamSchema.parse(request.params);
    await workspaceService.removeMember(id, userId, targetUserId);
    reply.status(204).send();
  }
}

export const workspaceController = new WorkspaceController();
