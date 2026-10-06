import type { FastifyRequest, FastifyReply } from 'fastify';
import { tokenService } from '../security/token-service.js';
import { UnauthorizedError } from '../errors/app-error.js';

export interface AuthContext {
  id: string;
  email: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthContext;
  }
}

export async function authGuard(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Missing or malformed Authorization header');
  }

  const token = authHeader.substring(7).trim();
  if (!token) {
    throw new UnauthorizedError('Bearer token is empty');
  }

  try {
    const payload = tokenService.verifyJwt(token, 'access');
    request.user = {
      id: payload.sub,
      email: payload.email,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid token';
    throw new UnauthorizedError(`Authentication failed: ${message}`);
  }
}
