import { randomUUID } from 'node:crypto';
import type { FastifyRequest, FastifyReply } from 'fastify';

declare module 'fastify' {
  interface FastifyRequest {
    correlationId: string;
  }
}

export async function correlationIdHook(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  const headerId =
    request.headers['x-correlation-id'] || request.headers['x-request-id'];

  const correlationId =
    typeof headerId === 'string' && headerId.trim().length > 0
      ? headerId.trim()
      : randomUUID();

  request.correlationId = correlationId;
  reply.header('x-correlation-id', correlationId);
}
