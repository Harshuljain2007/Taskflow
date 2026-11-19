import type { Response } from 'express';

export interface ApiSuccessPayload<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorPayload {
  success: false;
  message: string;
  code: string;
  details?: unknown;
}

export function sendSuccess<T>(
  res: Response,
  data: T,
  message = 'Operation completed',
  statusCode = 200,
): Response<ApiSuccessPayload<T>> {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function sendError(
  res: Response,
  message: string,
  code = 'INTERNAL_ERROR',
  statusCode = 500,
  details?: unknown,
): Response<ApiErrorPayload> {
  const body: ApiErrorPayload = {
    success: false,
    message,
    code,
  };

  if (details !== undefined) {
    body.details = details;
  }

  return res.status(statusCode).json(body);
}
