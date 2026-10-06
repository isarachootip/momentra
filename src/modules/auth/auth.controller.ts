import type { FastifyRequest, FastifyReply } from 'fastify';
import { authService } from './auth.service.js';
import { loginSchema, refreshSchema, logoutSchema } from './auth.schemas.js';
import { UnauthorizedError } from '../../core/errors/app-error.js';

export class AuthController {
  async login(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = loginSchema.parse(request.body);
    const meta = {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    };

    const response = await authService.login(input, meta);
    reply.status(200).send(response);
  }

  async refresh(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = refreshSchema.parse(request.body);
    const meta = {
      userAgent: request.headers['user-agent'],
      ipAddress: request.ip,
    };

    const response = await authService.refreshToken(input.refresh_token, meta);
    reply.status(200).send(response);
  }

  async logout(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = logoutSchema.parse(request.body || {});
    await authService.logout(input.refresh_token);
    reply.status(204).send();
  }

  async getMe(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!request.user) {
      throw new UnauthorizedError('User authentication context not found');
    }

    const response = await authService.getCurrentUser(request.user.id);
    reply.status(200).send(response);
  }
}

export const authController = new AuthController();
