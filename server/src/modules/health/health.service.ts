import { getDatabaseStatus, type DatabaseStatus } from '../../config/db.ts';
import { env } from '../../config/env.ts';

export interface HealthReport {
  service: string;
  version: string;
  status: 'healthy' | 'degraded';
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  database: DatabaseStatus;
}

export function getHealthReport(): HealthReport {
  const database = getDatabaseStatus();

  return {
    service: 'taskflow-api',
    version: '1.0.0',
    status: database.ready ? 'healthy' : 'degraded',
    environment: env.NODE_ENV,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database,
  };
}
