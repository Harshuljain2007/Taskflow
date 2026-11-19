import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config({ quiet: true });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MONGODB_URI: z.string().trim().optional().default(''),
  APP_URL: z.string().trim().optional().default(''),
  CORS_ORIGIN: z.string().trim().optional().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).default(15 * 60 * 1000),
  RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().min(1).default(200),
});

export interface AppEnv {
  NODE_ENV: 'development' | 'test' | 'production';
  PORT: number;
  MONGODB_URI: string;
  APP_URL: string;
  CORS_ORIGINS: string[];
  RATE_LIMIT_WINDOW_MS: number;
  RATE_LIMIT_MAX_REQUESTS: number;
}

export function loadEnv(raw: NodeJS.ProcessEnv = process.env): AppEnv {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${formatted}`);
  }

  const data = parsed.data;
  const corsOrigins = new Set<string>();

  for (const origin of data.CORS_ORIGIN.split(',')) {
    const trimmed = origin.trim();
    if (trimmed) {
      corsOrigins.add(trimmed);
    }
  }

  if (data.APP_URL && data.APP_URL !== 'MY_APP_URL') {
    corsOrigins.add(data.APP_URL.replace(/\/$/, ''));
  }

  return {
    NODE_ENV: data.NODE_ENV,
    PORT: data.PORT,
    MONGODB_URI: data.MONGODB_URI,
    APP_URL: data.APP_URL,
    CORS_ORIGINS: Array.from(corsOrigins),
    RATE_LIMIT_WINDOW_MS: data.RATE_LIMIT_WINDOW_MS,
    RATE_LIMIT_MAX_REQUESTS: data.RATE_LIMIT_MAX_REQUESTS,
  };
}

export const env = loadEnv();
