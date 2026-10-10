import Fastify, { type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import cookie from '@fastify/cookie';
import { env } from './config/env.js';
import { correlationIdHook } from './core/middleware/request-id.js';
import { errorHandler } from './core/middleware/error-handler.js';
import { foundationRoutes } from './modules/foundation/foundation.routes.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { searchRoutes } from './modules/search/search.routes.js';
import { timelineRoutes } from './modules/timeline/timeline.routes.js';
import { personalRoutes } from './modules/personal/personal.routes.js';
import { billingRoutes } from './modules/billing/billing.routes.js';
import { workspaceRoutes } from './modules/workspaces/workspace.routes.js';
import { userRoutes } from './modules/users/user.routes.js';
import { closeDatabasePool } from './db/pool.js';

export function buildApp(): FastifyInstance {
  const app = Fastify({
    logger: false, // We use structured custom logger and hooks
    trustProxy: true,
  });

  // 1. Cross-Origin Resource Sharing
  app.register(cors, {
    origin: env.CORS_ORIGIN === '*' ? true : env.CORS_ORIGIN,
    credentials: true,
  });

  // 2. Cookie Support
  app.register(cookie);

  // 3. Request Correlation ID Hook
  app.addHook('onRequest', correlationIdHook);

  // 4. Global RFC 9457 Error Handler
  app.setErrorHandler(errorHandler);

  // 5. Register Domain Routes
  app.register(foundationRoutes);
  app.register(authRoutes);
  app.register(searchRoutes);
  app.register(timelineRoutes);
  app.register(personalRoutes);
  app.register(billingRoutes);
  app.register(workspaceRoutes);
  app.register(userRoutes);

  // 6. Graceful Shutdown Hook
  app.addHook('onClose', async () => {
    await closeDatabasePool();
  });

  return app;
}
