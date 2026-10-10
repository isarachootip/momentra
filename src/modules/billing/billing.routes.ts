import type { FastifyInstance } from 'fastify';
import { billingController } from './billing.controller.js';
import { authGuard } from '../../core/middleware/auth-guard.js';

export async function billingRoutes(app: FastifyInstance): Promise<void> {
  // Public Endpoint: View available plans
  app.get('/api/v1/billing/plans', (req, reply) => billingController.getPlans(req, reply));

  // Webhook Endpoint (Stripe / Payment Provider calls this directly)
  app.post('/api/v1/billing/webhook', (req, reply) => billingController.handleWebhook(req, reply));

  // Protected User Endpoints
  app.get(
    '/api/v1/billing/subscription',
    { preHandler: authGuard },
    (req, reply) => billingController.getSubscription(req, reply)
  );

  app.get(
    '/api/v1/billing/invoices',
    { preHandler: authGuard },
    (req, reply) => billingController.getInvoices(req, reply)
  );

  app.post(
    '/api/v1/billing/checkout',
    { preHandler: authGuard },
    (req, reply) => billingController.createCheckout(req, reply)
  );
}
