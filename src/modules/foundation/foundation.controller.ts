import type { FastifyRequest, FastifyReply } from 'fastify';
import { foundationService } from './foundation.service.js';

export class FoundationController {
  async getHealth(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const health = await foundationService.getHealthStatus();
    const httpStatus = health.status === 'healthy' ? 200 : 503;
    reply.status(httpStatus).send(health);
  }
}

export const foundationController = new FoundationController();
