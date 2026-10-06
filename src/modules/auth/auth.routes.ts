import type { FastifyInstance } from 'fastify';
import { authController } from './auth.controller.js';
import { authGuard } from '../../core/middleware/auth-guard.js';

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // Public Auth Endpoints
  app.post('/api/v1/auth/login', (req, reply) => authController.login(req, reply));
  app.post('/api/v1/auth/refresh', (req, reply) => authController.refresh(req, reply));
  app.post('/api/v1/auth/logout', (req, reply) => authController.logout(req, reply));

  // Protected /me Endpoint
  app.get('/api/v1/me', { preHandler: authGuard }, (req, reply) =>
    authController.getMe(req, reply)
  );
}
