import { checkDatabaseConnection, type DatabaseHealth } from '../../db/pool.js';

export interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime_seconds: number;
  version: string;
  services: {
    database: {
      status: 'connected' | 'disconnected';
      latency_ms: number;
      error?: string;
    };
  };
}

export class FoundationService {
  private readonly startTime = Date.now();
  private readonly version = '1.0.0';

  async getHealthStatus(): Promise<HealthCheckResult> {
    const dbHealth: DatabaseHealth = await checkDatabaseConnection();

    const overallStatus: 'healthy' | 'degraded' | 'unhealthy' = dbHealth.healthy
      ? 'healthy'
      : 'unhealthy';

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      uptime_seconds: Math.floor((Date.now() - this.startTime) / 1000),
      version: this.version,
      services: {
        database: {
          status: dbHealth.healthy ? 'connected' : 'disconnected',
          latency_ms: dbHealth.latencyMs,
        },
      },
    };

    if (dbHealth.error) {
      result.services.database.error = dbHealth.error;
    }

    return result;
  }
}

export const foundationService = new FoundationService();
