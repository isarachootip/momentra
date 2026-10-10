import type { FastifyRequest, FastifyReply } from 'fastify';
import { userService } from './user.service.js';
import {
  createUserSchema,
  updateUserSchema,
  updateMeSchema,
  changePasswordSchema,
  listUsersQuerySchema,
  userIdParamSchema,
} from './user.schemas.js';
import { UnauthorizedError } from '../../core/errors/app-error.js';

export class UserController {
  private getUserId(request: FastifyRequest): string {
    if (!request.user?.id) {
      throw new UnauthorizedError('User authentication context not found');
    }
    return request.user.id;
  }

  async listUsers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const query = listUsersQuerySchema.parse(request.query);
    const response = await userService.listUsers(query);
    reply.status(200).send(response);
  }

  async getUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = userIdParamSchema.parse(request.params);
    const user = await userService.getUserById(id);
    reply.status(200).send(user);
  }

  async createUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = createUserSchema.parse(request.body);
    const user = await userService.createUser(input);
    reply.status(201).send(user);
  }

  async updateUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = userIdParamSchema.parse(request.params);
    const input = updateUserSchema.parse(request.body);
    const user = await userService.updateUser(id, input);
    reply.status(200).send(user);
  }

  async deleteUser(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = userIdParamSchema.parse(request.params);
    await userService.deleteUser(id);
    reply.status(204).send();
  }

  async updateMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = this.getUserId(request);
    const input = updateMeSchema.parse(request.body);
    const user = await userService.updateMe(userId, input);
    reply.status(200).send(user);
  }

  async changePassword(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const userId = this.getUserId(request);
    const input = changePasswordSchema.parse(request.body);
    await userService.changePassword(userId, input);
    reply.status(204).send();
  }
}

export const userController = new UserController();
