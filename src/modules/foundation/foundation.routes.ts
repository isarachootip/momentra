import type { FastifyInstance } from 'fastify';
import { foundationController } from './foundation.controller.js';

export async function foundationRoutes(app: FastifyInstance): Promise<void> {
  // Public root health check
  app.get('/health', (req, reply) => foundationController.getHealth(req, reply));

  // Public api/v1 health check
  app.get('/api/v1/health', (req, reply) => foundationController.getHealth(req, reply));
}
