import pino from 'pino';
import { env } from '../../config/env.js';

export interface LogContext {
  correlationId?: string;
  userId?: string;
  workspaceId?: string;
  [key: string]: unknown;
}

export const logger = pino({
  level: env.LOG_LEVEL,
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
  serializers: {
    req(request) {
      return {
        method: request.method,
        url: request.url,
        hostname: request.hostname,
        remoteAddress: request.ip,
        correlationId: request.headers['x-correlation-id'],
      };
    },
    res(reply) {
      return {
        statusCode: reply.statusCode,
      };
    },
    err: pino.stdSerializers.err,
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie', 'password', 'password_hash', 'id_token'],
    censor: '[REDACTED]',
  },
});

export function createChildLogger(context: LogContext): pino.Logger {
  return logger.child(context);
}
