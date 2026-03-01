import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Hono } from 'hono';
import type { Bindings } from '../types';
import { loggingMiddleware } from './logging';

function createTestApp(mockEnv: Bindings) {
  const app = new Hono<{ Bindings: Bindings }>();
  app.use('*', loggingMiddleware);
  app.get('/test', (c) => c.json({ message: 'success' }));
  app.post('/test', (c) => c.json({ message: 'created' }, 201));
  app.get('/error', () => {
    throw new Error('Test error');
  });
  return { app, env: mockEnv };
}

describe('loggingMiddleware', () => {
  let mockEnv: Bindings;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    mockEnv = {
      DB: {} as Bindings['DB'],
      AI: {} as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test-secret',
    };
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logs request information', async () => {
    const { app, env } = createTestApp(mockEnv);
    await app.request('/test', {
      method: 'GET',
      headers: {
        'user-agent': 'test-agent',
      },
    }, env);

    expect(consoleLogSpy).toHaveBeenCalled();
    const logCalls = consoleLogSpy.mock.calls;
    expect(logCalls.length).toBeGreaterThanOrEqual(1);
    
    // リクエスト開始ログを確認
    const requestLog = logCalls.find(call => 
      call[0]?.toString().includes('GET') && 
      call[0]?.toString().includes('/test')
    );
    expect(requestLog).toBeDefined();
  });

  it('logs response information including status code', async () => {
    const { app, env } = createTestApp(mockEnv);
    await app.request('/test', {
      method: 'GET',
    }, env);

    const logCalls = consoleLogSpy.mock.calls;
    // レスポンスログを確認（ステータスコード200を含む）
    const responseLog = logCalls.find(call => 
      call[0]?.toString().includes('200')
    );
    expect(responseLog).toBeDefined();
  });

  it('logs response time', async () => {
    const { app, env } = createTestApp(mockEnv);
    await app.request('/test', {
      method: 'GET',
    }, env);

    const logCalls = consoleLogSpy.mock.calls;
    // レスポンスログにmsが含まれることを確認
    const responseLog = logCalls.find(call => 
      call[0]?.toString().includes('ms')
    );
    expect(responseLog).toBeDefined();
  });

  it('logs different HTTP methods', async () => {
    const { app, env } = createTestApp(mockEnv);
    
    await app.request('/test', {
      method: 'GET',
    }, env);

    await app.request('/test', {
      method: 'POST',
    }, env);

    const logCalls = consoleLogSpy.mock.calls;
    const getLog = logCalls.find(call => call[0]?.toString().includes('GET'));
    const postLog = logCalls.find(call => call[0]?.toString().includes('POST'));
    
    expect(getLog).toBeDefined();
    expect(postLog).toBeDefined();
  });

  it('logs user agent when present', async () => {
    const { app, env } = createTestApp(mockEnv);
    await app.request('/test', {
      method: 'GET',
      headers: {
        'user-agent': 'Mozilla/5.0',
      },
    }, env);

    const logCalls = consoleLogSpy.mock.calls;
    const requestLog = logCalls.find(call => 
      call[0]?.toString().includes('Mozilla')
    );
    expect(requestLog).toBeDefined();
  });

  it('logs unknown when user agent is missing', async () => {
    const { app, env } = createTestApp(mockEnv);
    await app.request('/test', {
      method: 'GET',
    }, env);

    const logCalls = consoleLogSpy.mock.calls;
    const requestLog = logCalls.find(call => 
      call[0]?.toString().includes('unknown')
    );
    expect(requestLog).toBeDefined();
  });

  it('logs different status codes', async () => {
    const { app, env } = createTestApp(mockEnv);
    
    // 201ステータスコードを返すエンドポイント
    await app.request('/test', {
      method: 'POST',
    }, env);

    const logCalls = consoleLogSpy.mock.calls;
    const createdLog = logCalls.find(call => 
      call[0]?.toString().includes('201')
    );
    expect(createdLog).toBeDefined();
  });

  it('calls next middleware', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/test', {
      method: 'GET',
    }, env);

    expect(res.status).toBe(200);
    const body = await res.json() as { message: string };
    expect(body.message).toBe('success');
  });

  it('outputs structured log with path, method, status, durationMs (Task 4.2)', async () => {
    const { app, env } = createTestApp(mockEnv);
    await app.request('/test', { method: 'GET' }, env);

    const jsonCalls = consoleLogSpy.mock.calls
      .map((c) => c[0])
      .filter((arg): arg is string => typeof arg === 'string')
      .filter((s) => {
        try {
          const p = JSON.parse(s) as Record<string, unknown>;
          return typeof p.path === 'string' && typeof p.durationMs === 'number';
        } catch {
          return false;
        }
      });
    expect(jsonCalls.length).toBeGreaterThanOrEqual(1);
    const parsed = JSON.parse(jsonCalls[0]) as Record<string, unknown>;
    expect(parsed.path).toBe('/test');
    expect(parsed.method).toBe('GET');
    expect(parsed.status).toBe(200);
    expect(parsed.durationMs).toBeGreaterThanOrEqual(0);
    expect(parsed.timestamp).toBeDefined();
    expect(parsed.msg).toBeDefined();
  });
});
