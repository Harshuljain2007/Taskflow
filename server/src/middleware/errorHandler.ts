import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { env } from '../config/env.ts';
import { AppError } from '../utils/AppError.ts';
import { sendError } from '../utils/apiResponse.ts';

interface SyntaxErrorWithStatus extends SyntaxError {
  status?: number;
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    sendError(res, err.message, err.code, err.statusCode, err.details);
    return;
  }

  if (err instanceof ZodError) {
    sendError(
      res,
      'Validation failed',
      'VALIDATION_ERROR',
      400,
      err.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    );
    return;
  }

  if (err instanceof SyntaxError && (err as SyntaxErrorWithStatus).status === 400) {
    sendError(res, 'Malformed JSON request payload', 'INVALID_JSON', 400);
    return;
  }

  const isProd = env.NODE_ENV === 'production';
  const fallbackMessage =
    !isProd && err instanceof Error ? err.message : 'An unexpected internal error occurred';

  if (env.NODE_ENV !== 'test') {
    console.error('[TaskFlow API Error]', err instanceof Error ? err.message : err);
  }

  sendError(res, fallbackMessage, 'INTERNAL_ERROR', 500);
}
