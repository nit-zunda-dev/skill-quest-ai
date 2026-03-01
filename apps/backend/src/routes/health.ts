/**
 * ヘルスチェックルート（Task 3.1）
 * GET /api/health - 稼働状態を返す。認証なしで 200 と簡易ステータス（JSON）を返す。外形監視用。
 */
import { Hono } from 'hono';
import type { Bindings } from '../types';

export const healthRouter = new Hono<{ Bindings: Bindings }>();

healthRouter.get('/', (c) => {
  return c.json({ status: 'ok' });
});
