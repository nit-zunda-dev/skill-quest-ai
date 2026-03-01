/**
 * Task 5.2: 運用者 API ルートの単体テスト
 * X-Ops-API-Key と OPS_API_KEY の照合。キー未設定時は 404。
 */
import { describe, it, expect, vi } from 'vitest';
import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import type { Bindings } from '../types';
import { opsRouter } from './ops';

function createTestApp(env: Bindings) {
  const app = new Hono<{ Bindings: Bindings }>();
  app.route('/api/ops', opsRouter);
  return { app, env };
}

function createMockD1() {
  const prepare = vi.fn().mockImplementation((sql: string) => ({
    bind: vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue({ count: 2 }),
      all: vi.fn().mockResolvedValue({ results: [] }),
    }),
  }));
  return { prepare } as unknown as D1Database;
}

describe('ops router (Task 5.2)', () => {
  const validKey = 'ops-secret-key-123';

  describe('認可: OPS_API_KEY 未設定時は 404', () => {
    it('OPS_API_KEY が無い環境では GET /api/ops/stats が 404 を返す', async () => {
      const env: Bindings = {
        DB: createMockD1(),
        AI: {} as Bindings['AI'],
        BETTER_AUTH_SECRET: 'test',
        // OPS_API_KEY なし
      };
      const { app } = createTestApp(env);
      const res = await app.request('/api/ops/stats', {
        method: 'GET',
        headers: { 'X-Ops-API-Key': validKey },
      }, env);
      expect(res.status).toBe(404);
    });

    it('OPS_API_KEY が無い環境では GET /api/ops/ai-usage が 404 を返す', async () => {
      const env: Bindings = {
        DB: createMockD1(),
        AI: {} as Bindings['AI'],
        BETTER_AUTH_SECRET: 'test',
      };
      const { app } = createTestApp(env);
      const res = await app.request('/api/ops/ai-usage', {
        method: 'GET',
        headers: { 'X-Ops-API-Key': validKey },
      }, env);
      expect(res.status).toBe(404);
    });
  });

  describe('認可: X-Ops-API-Key 不一致時は 401', () => {
    const envWithKey: Bindings = {
      DB: createMockD1(),
      AI: {} as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test',
      OPS_API_KEY: validKey,
    };

    it('ヘッダーが無いと 401', async () => {
      const { app } = createTestApp(envWithKey);
      const res = await app.request('/api/ops/stats', { method: 'GET' }, envWithKey);
      expect(res.status).toBe(401);
    });

    it('ヘッダーが一致しないと 401', async () => {
      const { app } = createTestApp(envWithKey);
      const res = await app.request('/api/ops/stats', {
        method: 'GET',
        headers: { 'X-Ops-API-Key': 'wrong-key' },
      }, envWithKey);
      expect(res.status).toBe(401);
    });
  });

  describe('認可成功時は 200 と集計結果を返す', () => {
    const db = createMockD1();
    const envWithKey: Bindings = {
      DB: db,
      AI: {} as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test',
      OPS_API_KEY: validKey,
    };

    it('GET /api/ops/stats はキー一致時 200 と totalUsers, activeUsers を返す', async () => {
      const { app } = createTestApp(envWithKey);
      const res = await app.request('/api/ops/stats', {
        method: 'GET',
        headers: { 'X-Ops-API-Key': validKey },
      }, envWithKey);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { totalUsers: number; activeUsers: number };
      expect(body).toHaveProperty('totalUsers');
      expect(body).toHaveProperty('activeUsers');
    });

    it('GET /api/ops/ai-usage はキー一致時 200 と byDate, totalNeuronsEstimate を返す', async () => {
      const { app } = createTestApp(envWithKey);
      const res = await app.request('/api/ops/ai-usage?from=2026-01-01&to=2026-01-31', {
        method: 'GET',
        headers: { 'X-Ops-API-Key': validKey },
      }, envWithKey);
      expect(res.status).toBe(200);
      const body = (await res.json()) as { byDate: unknown[]; totalNeuronsEstimate: number };
      expect(body).toHaveProperty('byDate');
      expect(body).toHaveProperty('totalNeuronsEstimate');
    });
  });
});
