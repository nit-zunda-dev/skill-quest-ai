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

describe('setupMiddleware - HSTS (task 1.2)', () => {
  let mockEnv: Bindings;

  beforeEach(() => {
    mockEnv = {
      DB: {} as Bindings['DB'],
      AI: {} as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test-secret',
    };
  });

  it('does not set Strict-Transport-Security when request URL is HTTP (e.g. localhost)', async () => {
    const app = new Hono<{ Bindings: Bindings }>();
    setupMiddleware(app);
    app.get('/test', (c) => c.json({ message: 'ok' }));
    const req = new Request('http://localhost:8787/test', { method: 'GET' });
    const res = await app.request(req, mockEnv);
    expect(res.headers.get('Strict-Transport-Security')).toBeNull();
  });

  it('sets Strict-Transport-Security when request URL is HTTPS', async () => {
    const app = new Hono<{ Bindings: Bindings }>();
    setupMiddleware(app);
    app.get('/test', (c) => c.json({ message: 'ok' }));
    const req = new Request('https://api.example.com/test', { method: 'GET' });
    const res = await app.request(req, mockEnv);
    const hsts = res.headers.get('Strict-Transport-Security');
    expect(hsts).not.toBeNull();
    expect(hsts).toMatch(/max-age=\d+/);
  });
});
