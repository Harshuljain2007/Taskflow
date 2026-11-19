import fs from 'fs';
import http from 'http';
import path from 'path';
import express from 'express';
import { createApp } from './server/src/app.ts';
import { connectDatabase, disconnectDatabase } from './server/src/config/db.ts';
import { env } from './server/src/config/env.ts';
import { errorHandler } from './server/src/middleware/errorHandler.ts';

async function bootstrap(): Promise<void> {
  const app = createApp({ mountErrorHandler: false });

  const dbStatus = await connectDatabase(env.MONGODB_URI);
  if (dbStatus.ready) {
    console.info(
      `[TaskFlow DB] Ready (${dbStatus.provider}${dbStatus.projectId ? ` · ${dbStatus.projectId}` : ''}).`,
    );
  } else {
    console.warn(
      `[TaskFlow DB] Database unavailable (${dbStatus.state}): ${dbStatus.lastError ?? 'No connection'}`,
    );
  }

  if (env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    const indexPath = path.join(distDir, 'index.html');

    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir));
      app.use((_req, res, next) => {
        if (fs.existsSync(indexPath)) {
          res.sendFile(indexPath);
          return;
        }
        next();
      });
    }
  }

  app.use(errorHandler);

  const httpServer = http.createServer(app);

  httpServer.listen(env.PORT, '0.0.0.0', () => {
    console.info(`[TaskFlow Server] Listening on http://0.0.0.0:${env.PORT} (${env.NODE_ENV})`);
  });

  const shutdown = async (signal: string) => {
    console.info(`[TaskFlow Server] Received ${signal}, shutting down gracefully...`);
    httpServer.close(async () => {
      await disconnectDatabase();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((error) => {
  console.error('[TaskFlow Server] Failed to start:', error);
  process.exit(1);
});
