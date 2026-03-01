/**
 * ヘルスチェックルート（Task 3.1 / 3.2）
 * GET /api/health - 稼働状態を返す。認証なしで 200 と簡易ステータス（JSON）を返す。外形監視用。
 * Task 3.2: オプションで D1 に軽いクエリ（SELECT 1）で健全性を確認し、checks.db を含める。失敗時は status は ok のまま db のみ unhealthy。
 */
import { Hono } from 'hono';
import type { Bindings } from '../types';

export const healthRouter = new Hono<{ Bindings: Bindings }>();

healthRouter.get('/', async (c) => {
  const base = { status: 'ok' as const };
  const db = c.env.DB;
  if (db && typeof db.prepare === 'function') {
    try {
      await db.prepare('SELECT 1').first();
      return c.json({ ...base, checks: { db: 'ok' as const } });
    } catch {
      return c.json({ ...base, checks: { db: 'unhealthy' as const } });
    }
  }
  return c.json(base);
});
