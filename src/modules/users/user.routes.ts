import type { FastifyInstance } from 'fastify';
import { userController } from './user.controller.js';
import { authGuard } from '../../core/middleware/auth-guard.js';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  const guarded = { preHandler: authGuard };

  // Profile Self-Service
  app.patch('/api/v1/me', guarded, (req, reply) => userController.updateMe(req, reply));
  app.post('/api/v1/me/change-password', guarded, (req, reply) =>
    userController.changePassword(req, reply)
  );

  // User Directory / Administration CRUD
  app.get('/api/v1/users', guarded, (req, reply) => userController.listUsers(req, reply));
  app.post('/api/v1/users', guarded, (req, reply) => userController.createUser(req, reply));
  app.get('/api/v1/users/:id', guarded, (req, reply) => userController.getUser(req, reply));
  app.patch('/api/v1/users/:id', guarded, (req, reply) => userController.updateUser(req, reply));
  app.delete('/api/v1/users/:id', guarded, (req, reply) => userController.deleteUser(req, reply));
}
