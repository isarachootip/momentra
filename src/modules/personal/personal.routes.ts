import type { FastifyInstance } from 'fastify';
import { personalController } from './personal.controller.js';
import { authGuard } from '../../core/middleware/auth-guard.js';

export async function personalRoutes(app: FastifyInstance): Promise<void> {
  // Public Endpoint: View Published Personal Page & Timeline
  app.get<{ Params: { username: string } }>(
    '/api/v1/public/:username',
    (req, reply) => personalController.getPublicPage(req, reply)
  );

  // Profile Management
  app.patch(
    '/api/v1/personal/profile',
    { preHandler: authGuard },
    (req, reply) => personalController.updateProfile(req, reply)
  );

  // Social Discovery & Legacy Studio Endpoints
  app.post(
    '/api/v1/personal/discover',
    { preHandler: authGuard },
    (req, reply) => personalController.discover(req, reply)
  );
  app.post(
    '/api/v1/personal/parse-link',
    { preHandler: authGuard },
    (req, reply) => personalController.parseLink(req, reply)
  );
  app.patch(
    '/api/v1/personal/page-settings',
    { preHandler: authGuard },
    (req, reply) => personalController.updatePageSettings(req, reply)
  );
  app.post(
    '/api/v1/personal/import-link',
    { preHandler: authGuard },
    (req, reply) => personalController.importLink(req, reply)
  );

  // Social Links Management
  app.get(
    '/api/v1/personal/links',
    { preHandler: authGuard },
    (req, reply) => personalController.getLinks(req, reply)
  );
  app.post(
    '/api/v1/personal/links',
    { preHandler: authGuard },
    (req, reply) => personalController.createLink(req, reply)
  );
  app.patch<{ Params: { id: string } }>(
    '/api/v1/personal/links/:id',
    { preHandler: authGuard },
    (req, reply) => personalController.updateLink(req, reply)
  );
  app.delete<{ Params: { id: string } }>(
    '/api/v1/personal/links/:id',
    { preHandler: authGuard },
    (req, reply) => personalController.deleteLink(req, reply)
  );
  app.put(
    '/api/v1/personal/links/reorder',
    { preHandler: authGuard },
    (req, reply) => personalController.reorderLinks(req, reply)
  );

  // KM Items Management
  app.get<{ Querystring: { category?: string; sort?: 'asc' | 'desc' } }>(
    '/api/v1/personal/km',
    { preHandler: authGuard },
    (req, reply) => personalController.getKmItems(req, reply)
  );
  app.post(
    '/api/v1/personal/km',
    { preHandler: authGuard },
    (req, reply) => personalController.createKmItem(req, reply)
  );
  app.patch<{ Params: { id: string } }>(
    '/api/v1/personal/km/:id',
    { preHandler: authGuard },
    (req, reply) => personalController.updateKmItem(req, reply)
  );
  app.patch<{ Params: { id: string }; Body: { visibility: 'public' | 'private' } }>(
    '/api/v1/personal/km/:id/visibility',
    { preHandler: authGuard },
    (req, reply) => personalController.toggleKmVisibility(req, reply)
  );
  app.delete<{ Params: { id: string } }>(
    '/api/v1/personal/km/:id',
    { preHandler: authGuard },
    (req, reply) => personalController.deleteKmItem(req, reply)
  );
}
