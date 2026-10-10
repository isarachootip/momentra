import { userRepository } from './user.repository.js';
import { workspaceRepository } from '../workspaces/workspace.repository.js';
import { passwordService } from '../../core/security/password-service.js';
import {
  NotFoundError,
  ConflictError,
  UnauthorizedError,
} from '../../core/errors/app-error.js';
import type {
  UserSummary,
  UserDetailResponse,
  PaginatedUsersResponse,
  CreateUserDTO,
  UpdateUserDTO,
  UpdateMeDTO,
  ChangePasswordDTO,
} from './user.types.js';
import type { ListUsersQuery } from './user.schemas.js';

export class UserService {
  async listUsers(query: ListUsersQuery): Promise<PaginatedUsersResponse> {
    const params = {
      limit: query.limit,
      offset: query.offset,
      ...(query.search !== undefined ? { search: query.search } : {}),
      ...(query.include_deleted !== undefined ? { includeDeleted: query.include_deleted } : {}),
    };

    const [users, total] = await Promise.all([
      userRepository.listUsers(params),
      userRepository.countUsers(params),
    ]);

    return {
      users,
      total,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async getUserById(userId: string): Promise<UserDetailResponse> {
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const workspaces = await userRepository.getUserWorkspaces(userId);
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at,
      deleted_at: user.deleted_at,
      workspaces,
    };
  }

  async createUser(input: CreateUserDTO): Promise<UserDetailResponse> {
    const existing = await userRepository.findUserByEmail(input.email);
    if (existing) {
      throw new ConflictError('A user with this email address already exists');
    }

    const passwordHash = await passwordService.hashPassword(input.password);
    const user = await userRepository.createUser({
      email: input.email,
      password_hash: passwordHash,
      full_name: input.full_name,
      avatar_url: input.avatar_url ?? null,
    });

    // Auto-create initial personal workspace
    const baseSlug = input.email.split('@')[0]!.toLowerCase().replace(/[^a-z0-9-]+/g, '-');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;
    const ws = await workspaceRepository.createWorkspace({
      slug,
      name: `${input.full_name}'s Workspace`,
      type: 'personal',
      settings: {},
    });
    await workspaceRepository.addWorkspaceMember(ws.id, user.id, 'owner');

    const workspaces = await userRepository.getUserWorkspaces(user.id);
    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      avatar_url: user.avatar_url,
      created_at: user.created_at,
      updated_at: user.updated_at,
      deleted_at: user.deleted_at,
      workspaces,
    };
  }

  async updateUser(userId: string, input: UpdateUserDTO): Promise<UserSummary> {
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (input.email && input.email.toLowerCase() !== user.email.toLowerCase()) {
      const emailTaken = await userRepository.findUserByEmail(input.email);
      if (emailTaken) {
        throw new ConflictError('Email is already taken by another account');
      }
    }

    let passwordHash: string | undefined;
    if (input.password) {
      passwordHash = await passwordService.hashPassword(input.password);
    }

    const updated = await userRepository.updateUser(userId, {
      email: input.email,
      full_name: input.full_name,
      avatar_url: input.avatar_url,
      password_hash: passwordHash,
    });

    if (!updated) {
      throw new NotFoundError('Failed to update user');
    }

    return {
      id: updated.id,
      email: updated.email,
      full_name: updated.full_name,
      avatar_url: updated.avatar_url,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
      deleted_at: updated.deleted_at,
    };
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await userRepository.softDeleteUser(userId);
    await userRepository.revokeAllUserSessions(userId);
  }

  async updateMe(userId: string, input: UpdateMeDTO): Promise<UserSummary> {
    const payload: UpdateUserDTO = {};
    if (input.full_name !== undefined) payload.full_name = input.full_name;
    if (input.avatar_url !== undefined) payload.avatar_url = input.avatar_url;
    return this.updateUser(userId, payload);
  }

  async changePassword(userId: string, input: ChangePasswordDTO): Promise<void> {
    const user = await userRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const isValid = await passwordService.verifyPassword(
      input.current_password,
      user.password_hash
    );
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newHash = await passwordService.hashPassword(input.new_password);
    await userRepository.updateUser(userId, { password_hash: newHash });
    await userRepository.revokeAllUserSessions(userId);
  }
}

export const userService = new UserService();
