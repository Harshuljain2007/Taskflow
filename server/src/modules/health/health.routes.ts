import { Router } from 'express';
import { getHealthStatus, getReadinessStatus } from './health.controller.ts';

const healthRouter = Router();

healthRouter.get('/', getHealthStatus);
healthRouter.get('/ready', getReadinessStatus);

export { healthRouter };
