import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Bindings } from '../types';
import { setupMiddleware } from './index';

function createTestApp(mockEnv: Bindings) {
  const app = new Hono<{ Bindings: Bindings }>();
  setupMiddleware(app);
  app.get('/test', (c) => c.json({ message: 'ok' }));
  return { app, env: mockEnv };
}

describe('setupMiddleware - security headers', () => {
  let mockEnv: Bindings;

  beforeEach(() => {
    mockEnv = {
      DB: {} as Bindings['DB'],
      AI: {} as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test-secret',
    };
  });

  it('adds X-Content-Type-Options: nosniff to every response', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/test', { method: 'GET' }, env);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('adds X-Frame-Options to every response (DENY or SAMEORIGIN)', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/test', { method: 'GET' }, env);
    const value = res.headers.get('X-Frame-Options');
    expect(value === 'DENY' || value === 'SAMEORIGIN').toBe(true);
  });
});
