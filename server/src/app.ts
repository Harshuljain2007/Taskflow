import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { type Express } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.ts';
import { errorHandler } from './middleware/errorHandler.ts';
import { notFoundHandler } from './middleware/notFound.ts';
import { healthRouter } from './modules/health/health.routes.ts';
import { AppError } from './utils/AppError.ts';

export interface CreateAppOptions {
  enableRateLimit?: boolean;
  mountErrorHandler?: boolean;
}

export function createApp(options: CreateAppOptions = {}): Express {
  const { enableRateLimit = env.NODE_ENV !== 'test', mountErrorHandler = true } = options;

  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Security headers configured to work safely inside iframe preview environments
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      xFrameOptions: false,
    }),
  );

  // Explicit CORS allowlist
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);
          return;
        }

        const normalizedOrigin = origin.replace(/\/$/, '');
        if (env.CORS_ORIGINS.includes(normalizedOrigin)) {
          callback(null, true);
          return;
        }

        callback(new AppError('Origin not allowed by CORS policy', 403, 'CORS_FORBIDDEN'));
      },
      credentials: true,
    }),
  );

  app.use(express.json({ limit: '100kb' }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  app.use(cookieParser());

  if (enableRateLimit) {
    app.use(
      '/api',
      rateLimit({
        windowMs: env.RATE_LIMIT_WINDOW_MS,
        limit: env.RATE_LIMIT_MAX_REQUESTS,
        standardHeaders: 'draft-8',
        legacyHeaders: false,
        handler: (_req, res) => {
          res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later.',
            code: 'RATE_LIMIT_EXCEEDED',
          });
        },
      }),
    );
  }

  // API v1 Routes
  app.use('/api/v1/health', healthRouter);

  // Return structured JSON 404 for unmatched API routes
  app.use('/api', notFoundHandler);

  if (mountErrorHandler) {
    app.use(errorHandler);
  }

  return app;
}
