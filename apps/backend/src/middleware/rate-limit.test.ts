import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import type { Bindings, AuthUser } from '../types';
import { rateLimitMiddleware } from './rate-limit';

const testUser: AuthUser = { id: 'test-user-id', email: 'test@example.com', name: 'Test User' };

/** レート制限用のD1モック */
function createMockD1ForRateLimit(overrides?: {
  recentRequests?: Array<{ user_id: string; endpoint: string; created_at: number }>;
  deleteCount?: number;
}) {
  const recentRequests = overrides?.recentRequests ?? [];
  let deleteCallCount = 0;

  const first = async (sql: string, params?: unknown[]) => {
    if (sql.includes('SELECT') && sql.includes('COUNT(*)')) {
      // パラメータに基づいてフィルタリング
      // bind()で渡されたパラメータは配列として渡される
      if (params && params.length >= 3) {
        const userId = params[0] as string;
        const endpoint = params[1] as string;
        const windowStart = params[2] as number;
        
        const filtered = recentRequests.filter(
          (req) =>
            req.user_id === userId &&
            req.endpoint === endpoint &&
            req.created_at > windowStart
        );
        return { count: filtered.length };
      }
      // パラメータがない場合は全件を返す
      return { count: recentRequests.length };
    }
    return null;
  };

  const run = async (sql: string) => {
    if (sql.includes('DELETE') && sql.includes('rate_limit_logs')) {
      deleteCallCount++;
      return { success: true, meta: {} };
    }
    if (sql.includes('INSERT') && sql.includes('rate_limit_logs')) {
      return { success: true, meta: {} };
    }
    return { success: true, meta: {} };
  };

  const prepare = (sql: string) => ({
    bind: (...args: unknown[]) => {
      // bind()で渡されたパラメータを保存
      const boundParams = args;
      return {
        run: async () => run(sql),
        first: async () => first(sql, boundParams),
      };
    },
  });

  return {
    prepare,
    first: async (sql: string, ...params: unknown[]) => first(sql, params),
    run: async (sql: string) => run(sql),
    getDeleteCallCount: () => deleteCallCount,
  };
}

function createTestApp(mockEnv: Bindings, user?: AuthUser) {
  const app = new Hono<{ Bindings: Bindings; Variables: { user: AuthUser } }>();
  // ユーザーをコンテキストに設定
  app.use('*', async (c, next) => {
    c.set('user', user ?? testUser);
    await next();
  });
  // レート制限ミドルウェアを適用
  app.use('*', rateLimitMiddleware);
  // テスト用のエンドポイント
  app.post('/api/ai/generate-character', (c) => {
    return c.json({ success: true });
  });
  app.post('/api/ai/generate-narrative', (c) => {
    return c.json({ success: true });
  });
  return { app, env: mockEnv };
}

describe('rateLimitMiddleware', () => {
  let mockEnv: Bindings;

  beforeEach(() => {
    mockEnv = {
      DB: createMockD1ForRateLimit() as unknown as Bindings['DB'],
      AI: {} as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test-secret',
    };
  });

  it('allows request when under rate limit', async () => {
    const { app, env } = createTestApp(mockEnv);
    const res = await app.request('/api/ai/generate-character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, env);
    expect(res.status).toBe(200);
  });

  it('blocks request when rate limit exceeded', async () => {
    // 1分以内に10回のリクエストをシミュレート（10回目で制限に達する）
    // 注意: 10回のリクエストがある場合、11回目のリクエストで429が返される
    const now = Date.now();
    const windowStart = now - 60 * 1000; // 1分前
    const recentRequests = Array.from({ length: 10 }, (_, i) => ({
      user_id: testUser.id,
      endpoint: '/api/ai/generate-character',
      created_at: windowStart + (i + 1) * 1000, // windowStartより大きい値（1秒ずつ増加）
    }));

    mockEnv.DB = createMockD1ForRateLimit({ recentRequests }) as unknown as Bindings['DB'];
    const { app, env } = createTestApp(mockEnv);

    const res = await app.request('/api/ai/generate-character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, env);
    // 10回のリクエストがある場合、11回目（今回）で429が返される
    expect(res.status).toBe(429);
    // エラーハンドラーがJSONまたはテキストを返す可能性がある
    const contentType = res.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const body = await res.json() as { error?: string; message?: string };
      expect(body.error || body.message).toContain('Too Many Requests');
    } else {
      const text = await res.text();
      expect(text).toContain('Too Many Requests');
    }
  });

  it('allows request when old requests exist outside time window', async () => {
    // 1分以上前のリクエストはカウントしない
    const now = Date.now();
    const oldRequests = Array.from({ length: 10 }, (_, i) => ({
      user_id: testUser.id,
      endpoint: '/api/ai/generate-character',
      created_at: now - (120 + i * 5) * 1000, // 2分以上前
    }));

    mockEnv.DB = createMockD1ForRateLimit({ recentRequests: oldRequests }) as unknown as Bindings['DB'];
    const { app, env } = createTestApp(mockEnv);

    const res = await app.request('/api/ai/generate-character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, env);
    expect(res.status).toBe(200);
  });

  it('tracks requests per endpoint separately', async () => {
    // 異なるエンドポイントのリクエストは別々にカウント
    const now = Date.now();
    const recentRequests = Array.from({ length: 10 }, (_, i) => ({
      user_id: testUser.id,
      endpoint: '/api/ai/generate-narrative',
      created_at: now - (60 - i * 5) * 1000,
    }));

    mockEnv.DB = createMockD1ForRateLimit({ recentRequests }) as unknown as Bindings['DB'];
    const { app, env } = createTestApp(mockEnv);
    // generate-characterエンドポイントへのリクエストは許可される（generate-narrativeとは別カウント）
    const res = await app.request('/api/ai/generate-character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, env);
    expect(res.status).toBe(200);
  });

  it('tracks requests per user separately', async () => {
    // 異なるユーザーのリクエストは別々にカウント
    const now = Date.now();
    const recentRequests = Array.from({ length: 10 }, (_, i) => ({
      user_id: 'other-user-id',
      endpoint: '/api/ai/generate-character',
      created_at: now - (60 - i * 5) * 1000,
    }));

    mockEnv.DB = createMockD1ForRateLimit({ recentRequests }) as unknown as Bindings['DB'];
    const { app, env } = createTestApp(mockEnv);
    // 別ユーザーのリクエストはカウントしない
    const res = await app.request('/api/ai/generate-character', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    }, env);
    expect(res.status).toBe(200);
  });
});
