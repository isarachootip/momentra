import { buildApp } from './app.js';
import { env } from './config/env.js';
import { logger } from './core/logger/index.js';

async function startServer(): Promise<void> {
  const app = buildApp();

  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutting down Momentra Core API gracefully...');
    try {
      await app.close();
      logger.info('Server closed successfully');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, 'Error during server shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  try {
    const address = await app.listen({ port: env.PORT, host: env.HOST });
    logger.info(
      {
        port: env.PORT,
        host: env.HOST,
        env: env.NODE_ENV,
        address,
      },
      `Momentra Core API listening on ${address}`
    );
  } catch (err) {
    logger.fatal({ err }, 'Failed to start Momentra Core API');
    process.exit(1);
  }
}

startServer();
