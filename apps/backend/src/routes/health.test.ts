/**
 * Task 3.1 / 3.2: GET /api/health の単体テスト
 * 稼働状態を返すエンドポイント。認証なしで 200 と簡易ステータス（JSON）を返す。
 * Task 3.2: オプションで D1 健全性を checks.db に含める。失敗時は status は ok のまま db のみ unhealthy。
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
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
      const body = (await res.json()) as { status: string; checks?: { db: string } };
      expect(body).toMatchObject({ status: 'ok' });
    });

    it('外形監視が HTTP で叩ける（GET のみで成功）', async () => {
      const { app, env } = createTestApp(mockEnv);
      const res = await app.request('/api/health', { method: 'GET' }, env);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('application/json');
    });
  });

  describe('Task 3.2: D1 健全性チェック（checks.db）', () => {
    it('D1 が利用可能で軽いクエリが成功するとき checks.db を "ok" で返す', async () => {
      const db = {
        prepare: vi.fn().mockImplementation((_sql: string) => ({
          first: vi.fn().mockResolvedValue({ 1: 1 }),
        })),
      } as unknown as D1Database;
      const envWithDb: Bindings = { ...mockEnv, DB: db };
      const { app } = createTestApp(envWithDb);

      const res = await app.request('/api/health', { method: 'GET' }, envWithDb);

      expect(res.status).toBe(200);
      const body = (await res.json()) as { status: string; checks?: { db: string } };
      expect(body.status).toBe('ok');
      expect(body.checks).toEqual({ db: 'ok' });
    });

    it('D1 クエリが失敗したとき status は ok のまま checks.db のみ "unhealthy" とする', async () => {
      const db = {
        prepare: vi.fn().mockImplementation((_sql: string) => ({
          first: vi.fn().mockRejectedValue(new Error('D1 unavailable')),
        })),
      } as unknown as D1Database;
      const envWithDb: Bindings = { ...mockEnv, DB: db };
      const { app } = createTestApp(envWithDb);

      const res = await app.request('/api/health', { method: 'GET' }, envWithDb);

      expect(res.status).toBe(200);
      const body = (await res.json()) as { status: string; checks?: { db: string } };
      expect(body.status).toBe('ok');
      expect(body.checks).toEqual({ db: 'unhealthy' });
    });
  });
});
