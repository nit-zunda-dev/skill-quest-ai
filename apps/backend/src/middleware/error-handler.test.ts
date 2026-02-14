import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Bindings } from '../types';
import { errorHandler } from './error-handler';

function createTestApp(mockEnv: Bindings) {
  const app = new Hono<{ Bindings: Bindings }>();
  app.onError(errorHandler);
  app.get('/http-exception-400', () => {
    throw new HTTPException(400, { message: 'Bad Request' });
  });
  app.get('/http-exception-401', () => {
    throw new HTTPException(401, { message: 'Unauthorized' });
  });
  app.get('/http-exception-404', () => {
    throw new HTTPException(404, { message: 'Not Found' });
  });
  app.get('/http-exception-429', () => {
    throw new HTTPException(429, { message: 'Too Many Requests' });
  });
  app.get('/http-exception-500', () => {
    throw new HTTPException(500, { message: 'Internal Server Error' });
  });
  app.get('/generic-error', () => {
    throw new Error('Generic error');
  });
  app.get('/custom-error', () => {
    throw new TypeError('Type error');
  });
  return { app, env: mockEnv };
}

describe('errorHandler', () => {
  let mockEnv: Bindings;

  beforeEach(() => {
    mockEnv = {
      DB: {} as Bindings['DB'],
      AI: {} as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test-secret',
    };
  });

  it('handles HTTPException 400 correctly', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/http-exception-400', {
      method: 'GET',
    }, env);

    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string; message: string; timestamp: string } };
    expect(body.error.code).toBe('BAD_REQUEST');
    expect(body.error.message).toBe('Bad Request');
    expect(body.error.timestamp).toBeDefined();
  });

  it('handles HTTPException 401 correctly', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/http-exception-401', {
      method: 'GET',
    }, env);

    expect(res.status).toBe(401);
    const body = await res.json() as { error: { code: string; message: string; timestamp: string } };
    expect(body.error.code).toBe('UNAUTHORIZED');
    expect(body.error.message).toBe('Unauthorized');
    expect(body.error.timestamp).toBeDefined();
  });

  it('handles HTTPException 404 correctly', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/http-exception-404', {
      method: 'GET',
    }, env);

    expect(res.status).toBe(404);
    const body = await res.json() as { error: { code: string; message: string; timestamp: string } };
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Not Found');
    expect(body.error.timestamp).toBeDefined();
  });

  it('handles HTTPException 429 correctly', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/http-exception-429', {
      method: 'GET',
    }, env);

    expect(res.status).toBe(429);
    const body = await res.json() as { error: { code: string; message: string; timestamp: string } };
    expect(body.error.code).toBe('TOO_MANY_REQUESTS');
    expect(body.error.message).toBe('Too Many Requests');
    expect(body.error.timestamp).toBeDefined();
  });

  it('handles HTTPException 500 correctly', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/http-exception-500', {
      method: 'GET',
    }, env);

    expect(res.status).toBe(500);
    const body = await res.json() as { error: { code: string; message: string; timestamp: string } };
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(body.error.message).toBe('Internal Server Error');
    expect(body.error.timestamp).toBeDefined();
  });

  it('handles HTTPException with custom message', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/http-exception-400', {
      method: 'GET',
    }, env);

    expect(res.status).toBe(400);
    const body = await res.json() as { error: { code: string; message: string; timestamp: string } };
    expect(body.error.message).toBe('Bad Request');
  });

  it('handles HTTPException without message (uses default)', async () => {
    const app = new Hono<{ Bindings: Bindings }>();
    app.onError(errorHandler);
    app.get('/no-message', () => {
      throw new HTTPException(404);
    });

    const res = await app.request('/no-message', {
      method: 'GET',
    }, mockEnv);

    expect(res.status).toBe(404);
    const body = await res.json() as { error: { code: string; message: string; timestamp: string } };
    expect(body.error.code).toBe('NOT_FOUND');
    expect(body.error.message).toBe('Not Found');
  });

  it('handles generic Error as 500', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/generic-error', {
      method: 'GET',
    }, env);

    expect(res.status).toBe(500);
    const body = await res.json() as { error: { code: string; message: string; timestamp: string } };
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(body.error.message).toBe('An unexpected error occurred');
    expect(body.error.timestamp).toBeDefined();
  });

  it('handles TypeError as 500', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/custom-error', {
      method: 'GET',
    }, env);

    expect(res.status).toBe(500);
    const body = await res.json() as { error: { code: string; message: string; timestamp: string } };
    expect(body.error.code).toBe('INTERNAL_SERVER_ERROR');
    expect(body.error.message).toBe('An unexpected error occurred');
  });

  it('includes timestamp in error response', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/http-exception-400', {
      method: 'GET',
    }, env);

    const body = await res.json() as { error: { timestamp: string } };
    const timestamp = new Date(body.error.timestamp);
    expect(timestamp.getTime()).toBeGreaterThan(0);
    expect(timestamp.toISOString()).toBe(body.error.timestamp);
  });

  it('handles unknown status codes', async () => {
    const app = new Hono<{ Bindings: Bindings }>();
    app.onError(errorHandler);
    app.get('/unknown-status', () => {
      throw new HTTPException(418, { message: "I'm a teapot" });
    });

    const res = await app.request('/unknown-status', {
      method: 'GET',
    }, mockEnv);

    expect(res.status).toBe(418);
    const body = await res.json() as { error: { code: string; message: string; timestamp: string } };
    expect(body.error.code).toBe('UNKNOWN_ERROR');
    expect(body.error.message).toBe("I'm a teapot");
  });

  it('handles 403 Forbidden', async () => {
    const app = new Hono<{ Bindings: Bindings }>();
    app.onError(errorHandler);
    app.get('/forbidden', () => {
      throw new HTTPException(403, { message: 'Forbidden' });
    });

    const res = await app.request('/forbidden', {
      method: 'GET',
    }, mockEnv);

    expect(res.status).toBe(403);
    const body = await res.json() as { error: { code: string; message: string; timestamp: string } };
    expect(body.error.code).toBe('FORBIDDEN');
    expect(body.error.message).toBe('Forbidden');
  });

  it('handles 409 Conflict', async () => {
    const app = new Hono<{ Bindings: Bindings }>();
    app.onError(errorHandler);
    app.get('/conflict', () => {
      throw new HTTPException(409, { message: 'Conflict' });
    });

    const res = await app.request('/conflict', {
      method: 'GET',
    }, mockEnv);

    expect(res.status).toBe(409);
    const body = await res.json() as { error: { code: string; message: string; timestamp: string } };
    expect(body.error.code).toBe('CONFLICT');
    expect(body.error.message).toBe('Conflict');
  });

  it('handles 422 Unprocessable Entity', async () => {
    const app = new Hono<{ Bindings: Bindings }>();
    app.onError(errorHandler);
    app.get('/unprocessable', () => {
      throw new HTTPException(422, { message: 'Unprocessable Entity' });
    });

    const res = await app.request('/unprocessable', {
      method: 'GET',
    }, mockEnv);

    expect(res.status).toBe(422);
    const body = await res.json() as { error: { code: string; message: string; timestamp: string } };
    expect(body.error.code).toBe('UNPROCESSABLE_ENTITY');
    expect(body.error.message).toBe('Unprocessable Entity');
  });

  it('handles 503 Service Unavailable', async () => {
    const app = new Hono<{ Bindings: Bindings }>();
    app.onError(errorHandler);
    app.get('/unavailable', () => {
      throw new HTTPException(503, { message: 'Service Unavailable' });
    });

    const res = await app.request('/unavailable', {
      method: 'GET',
    }, mockEnv);

    expect(res.status).toBe(503);
    const body = await res.json() as { error: { code: string; message: string; timestamp: string } };
    expect(body.error.code).toBe('SERVICE_UNAVAILABLE');
    expect(body.error.message).toBe('Service Unavailable');
  });
});
