import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../../../app.ts';
import { sanitizeMongoError } from '../../../config/db.ts';

describe('Phase 1 Foundation — Health & Error Handling API', () => {
  const app = createApp({ enableRateLimit: false });

  it('GET /api/v1/health returns consistent envelope with provisioned Firebase Firestore status', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Service health status retrieved');
    expect(response.body.data).toMatchObject({
      service: 'taskflow-api',
      version: '1.0.0',
      status: 'healthy',
      database: {
        provider: 'firebase-firestore',
        state: 'configured',
        ready: true,
        configured: true,
      },
    });
    expect(typeof response.body.data.database.projectId).toBe('string');
    expect(typeof response.body.data.database.databaseId).toBe('string');
    expect(typeof response.body.data.timestamp).toBe('string');
  });

  it('GET /api/v1/health/ready returns 200 when database is configured', async () => {
    const response = await request(app).get('/api/v1/health/ready');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Service is ready');
  });

  it('GET /api/v1/unknown-endpoint returns standardized 404 JSON error', async () => {
    const response = await request(app).get('/api/v1/unknown-endpoint');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: 'Route GET /api/v1/unknown-endpoint not found',
      code: 'ROUTE_NOT_FOUND',
    });
  });

  it('rejects malformed JSON body with 400 INVALID_JSON error', async () => {
    const response = await request(app)
      .post('/api/v1/health')
      .set('Content-Type', 'application/json')
      .send('{"broken":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: 'Malformed JSON request payload',
      code: 'INVALID_JSON',
    });
  });

  it('sanitizes MongoDB credentials from connection error messages', () => {
    const raw = new Error('failed connecting to mongodb+srv://admin:supersecret@cluster0.mongodb.net/taskflow');
    const sanitized = sanitizeMongoError(raw);

    expect(sanitized).not.toContain('supersecret');
    expect(sanitized).toContain('mongodb+srv://***:***@cluster0.mongodb.net/taskflow');
  });
});
