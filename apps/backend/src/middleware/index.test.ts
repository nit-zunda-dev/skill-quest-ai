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

// Task 4.1 / Req 7.1: バックエンドのセキュリティヘッダーと CORS を検証
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

describe('setupMiddleware - CORS allowlist (task 1.3)', () => {
  function createApp(env: Bindings) {
    const app = new Hono<{ Bindings: Bindings }>();
    setupMiddleware(app);
    app.get('/test', (c) => c.json({ message: 'ok' }));
    return app;
  }

  it('returns request Origin as Access-Control-Allow-Origin when Origin is in allowlist (localhost:3000)', async () => {
    const env: Bindings = {
      DB: {} as Bindings['DB'],
      AI: {} as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test-secret',
    };
    const app = createApp(env);
    const req = new Request('http://localhost:8787/test', {
      method: 'GET',
      headers: { Origin: 'http://localhost:3000' },
    });
    const res = await app.request(req, env);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:3000');
    expect(res.headers.get('Access-Control-Allow-Origin')).not.toBe('*');
  });

  it('returns request Origin when Origin is localhost:5173', async () => {
    const env: Bindings = {
      DB: {} as Bindings['DB'],
      AI: {} as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test-secret',
    };
    const app = createApp(env);
    const req = new Request('http://localhost:8787/test', {
      method: 'GET',
      headers: { Origin: 'http://localhost:5173' },
    });
    const res = await app.request(req, env);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:5173');
  });

  it('returns request Origin when Origin is localhost:8787', async () => {
    const env: Bindings = {
      DB: {} as Bindings['DB'],
      AI: {} as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test-secret',
    };
    const app = createApp(env);
    const req = new Request('http://localhost:8787/test', {
      method: 'GET',
      headers: { Origin: 'http://localhost:8787' },
    });
    const res = await app.request(req, env);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:8787');
  });

  it('returns request Origin when Origin equals FRONTEND_URL', async () => {
    const env: Bindings = {
      DB: {} as Bindings['DB'],
      AI: {} as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test-secret',
      FRONTEND_URL: 'https://app.example.com',
    };
    const app = createApp(env);
    // Use (path, init, env) so Hono injects env into c.env (e.g. in Workers)
    const res = await app.request('http://localhost:8787/test', {
      method: 'GET',
      headers: { Origin: 'https://app.example.com' },
    }, env);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe('https://app.example.com');
  });

  it('does not echo or return * for Origin not in allowlist (credentials safe)', async () => {
    const env: Bindings = {
      DB: {} as Bindings['DB'],
      AI: {} as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test-secret',
    };
    const app = createApp(env);
    const req = new Request('http://localhost:8787/test', {
      method: 'GET',
      headers: { Origin: 'https://evil.example.com' },
    });
    const res = await app.request(req, env);
    const allowOrigin = res.headers.get('Access-Control-Allow-Origin');
    expect(allowOrigin).not.toBe('*');
    expect(allowOrigin).not.toBe('https://evil.example.com');
  });

  it('exposes only Content-Length in Access-Control-Expose-Headers', async () => {
    const env: Bindings = {
      DB: {} as Bindings['DB'],
      AI: {} as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test-secret',
    };
    const app = createApp(env);
    const req = new Request('http://localhost:8787/test', {
      method: 'GET',
      headers: { Origin: 'http://localhost:3000' },
    });
    const res = await app.request(req, env);
    const expose = res.headers.get('Access-Control-Expose-Headers');
    expect(expose?.toLowerCase()).toBe('content-length');
  });
});
