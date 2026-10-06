import type { FastifyInstance } from 'fastify';
import { timelineController } from './timeline.controller.js';
import { authGuard } from '../../core/middleware/auth-guard.js';

export async function timelineRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/api/v1/timeline',
    { preHandler: [authGuard] },
    (request, reply) => timelineController.getTimeline(request, reply)
  );
}
