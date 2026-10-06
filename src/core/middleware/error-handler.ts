import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { createProblemDetails } from '../errors/problem-details.js';
import { logger } from '../logger/index.js';

export function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): void {
  const correlationId = request.correlationId;
  const acceptLanguage = request.headers['accept-language'];
  const instance = request.url;

  // 1. Domain / App Errors
  if (error instanceof AppError) {
    const problem = createProblemDetails({
      status: error.statusCode,
      code: error.errorCode,
      detail: error.message,
      instance,
      correlationId,
      invalidParams: error.invalidParams,
      acceptLanguage,
    });
    reply.status(error.statusCode).header('content-type', 'application/problem+json').send(problem);
    return;
  }

  // 2. Zod Validation Errors
  if (error instanceof ZodError) {
    const invalidParams = error.issues.map((issue) => ({
      name: issue.path.join('.'),
      reason: issue.message,
    }));
    const problem = createProblemDetails({
      status: 400,
      code: 'VALIDATION_FAILED',
      detail: 'Request payload validation failed',
      instance,
      correlationId,
      invalidParams,
      acceptLanguage,
    });
    reply.status(400).header('content-type', 'application/problem+json').send(problem);
    return;
  }

  // 3. Fastify Validation Errors (Ajv)
  if ('validation' in error && Array.isArray((error as FastifyError).validation)) {
    const fastifyErr = error as FastifyError;
    const invalidParams = (fastifyErr.validation || []).map((val) => ({
      name: String(val.instancePath || val.params?.['missingProperty'] || 'body'),
      reason: String(val.message || 'Invalid value'),
    }));
    const problem = createProblemDetails({
      status: 400,
      code: 'VALIDATION_FAILED',
      detail: fastifyErr.message,
      instance,
      correlationId,
      invalidParams,
      acceptLanguage,
    });
    reply.status(400).header('content-type', 'application/problem+json').send(problem);
    return;
  }

  // 4. Unexpected 500 Errors
  logger.error(
    {
      err: error,
      correlationId,
      url: request.url,
      method: request.method,
    },
    'Unhandled server exception'
  );

  const problem = createProblemDetails({
    status: 500,
    code: 'INTERNAL_SERVER_ERROR',
    instance,
    correlationId,
    acceptLanguage,
  });

  reply.status(500).header('content-type', 'application/problem+json').send(problem);
}
