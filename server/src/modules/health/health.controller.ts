import type { Request, Response } from 'express';
import { sendError, sendSuccess } from '../../utils/apiResponse.ts';
import { getHealthReport } from './health.service.ts';

export function getHealthStatus(_req: Request, res: Response): void {
  const report = getHealthReport();
  sendSuccess(res, report, 'Service health status retrieved', 200);
}

export function getReadinessStatus(_req: Request, res: Response): void {
  const report = getHealthReport();

  if (!report.database.ready) {
    sendError(
      res,
      report.database.lastError ?? 'Database connection is unavailable',
      'DATABASE_UNAVAILABLE',
      503,
      report,
    );
    return;
  }

  sendSuccess(res, report, 'Service is ready', 200);
}
