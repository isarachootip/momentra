import type { FastifyInstance } from 'fastify';
import { searchController } from './search.controller.js';
import { authGuard } from '../../core/middleware/auth-guard.js';

export async function searchRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/api/v1/search',
    { preHandler: [authGuard] },
    (request, reply) => searchController.search(request, reply)
  );
}
