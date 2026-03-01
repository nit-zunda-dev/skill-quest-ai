/**
 * Task 3.1: GET /api/health の単体テスト
 * 稼働状態を返すエンドポイント。認証なしで 200 と簡易ステータス（JSON）を返す。
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { Bindings } from '../types';
import { healthRouter } from './health';

function createTestApp(mockEnv: Bindings) {
  const app = new Hono<{ Bindings: Bindings }>();
  app.route('/api/health', healthRouter);
  return { app, env: mockEnv };
}

describe('health router (Task 3.1)', () => {
  let mockEnv: Bindings;

  beforeEach(() => {
    mockEnv = {
      DB: {} as Bindings['DB'],
      AI: {} as Bindings['AI'],
      BETTER_AUTH_SECRET: 'test-secret',
    };
  });

  describe('GET /api/health', () => {
    it('認証なしで 200 と status: ok の JSON を返す', async () => {
      const { app, env } = createTestApp(mockEnv);
      const res = await app.request('/api/health', { method: 'GET' }, env);

      expect(res.status).toBe(200);
      const body = (await res.json()) as { status: string };
      expect(body).toEqual({ status: 'ok' });
    });

    it('外形監視が HTTP で叩ける（GET のみで成功）', async () => {
      const { app, env } = createTestApp(mockEnv);
      const res = await app.request('/api/health', { method: 'GET' }, env);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('application/json');
    });
  });
});
