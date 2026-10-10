import type { FastifyRequest, FastifyReply } from 'fastify';
import { billingService } from './billing.service.js';
import { quotaService } from './quota.service.js';
import { createCheckoutSchema, billingWebhookSchema } from './billing.schemas.js';
import { UnauthorizedError } from '../../core/errors/app-error.js';

export class BillingController {
  async getPlans(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const plans = await billingService.getPlans();
    reply.status(200).send({ data: plans });
  }

  async getSubscription(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const [subscription, quota] = await Promise.all([
      billingService.getUserSubscription(req.user.id),
      quotaService.getQuotaStatus(req.user.id),
    ]);
    reply.status(200).send({ data: { subscription, quota } });
  }

  async getInvoices(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const invoices = await billingService.getInvoices(req.user.id);
    reply.status(200).send({ data: invoices });
  }

  async createCheckout(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    if (!req.user) throw new UnauthorizedError('Authentication required');
    const input = createCheckoutSchema.parse(req.body);
    const session = await billingService.createCheckoutSession(req.user.id, input);
    reply.status(200).send({ data: session });
  }

  async handleWebhook(req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const input = billingWebhookSchema.parse(req.body);
    const result = await billingService.processWebhook(input);
    reply.status(200).send(result);
  }
}

export const billingController = new BillingController();
