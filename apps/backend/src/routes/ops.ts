/**
 * Task 5.2: 運用者 API ルート
 * X-Ops-API-Key と OPS_API_KEY を照合。未設定時は 404。一致時のみ GET /api/ops/stats, GET /api/ops/ai-usage を許可。
 */
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Bindings } from '../types';
import {
  getAiUsageAggregation,
  getTotalUserCount,
  getActiveUserCount,
  AI_USAGE_MAX_DAYS,
  ACTIVE_USER_DEFAULT_DAYS,
} from '../services/ops';

export const opsRouter = new Hono<{ Bindings: Bindings }>();

/** 日付 YYYY-MM-DD の簡易検証 */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseDateRange(from: string | undefined, to: string | undefined): { from: string; to: string } | { error: string } {
  const today = new Date().toISOString().slice(0, 10);
  const f = from ?? today;
  const t = to ?? today;
  if (!DATE_RE.test(f) || !DATE_RE.test(t)) {
    return { error: 'from and to must be YYYY-MM-DD' };
  }
  if (f > t) {
    return { error: 'from must be <= to' };
  }
  const fromDate = new Date(f);
  const toDate = new Date(t);
  const days = Math.round((toDate.getTime() - fromDate.getTime()) / 86400000);
  if (days > AI_USAGE_MAX_DAYS) {
    return { error: `Date range must not exceed ${AI_USAGE_MAX_DAYS} days` };
  }
  return { from: f, to: t };
}

opsRouter.use('*', async (c, next) => {
  const key = c.env.OPS_API_KEY;
  if (key === undefined || key === '') {
    return c.json({ error: 'Ops API not configured' }, 404);
  }
  const headerKey = c.req.header('X-Ops-API-Key');
  if (headerKey !== key) {
    throw new HTTPException(401, { message: 'Invalid or missing X-Ops-API-Key' });
  }
  await next();
});

opsRouter.get('/stats', async (c) => {
  const db = c.env.DB;
  const totalUsers = await getTotalUserCount(db);
  const activeUsers = await getActiveUserCount(db, ACTIVE_USER_DEFAULT_DAYS);
  return c.json({ totalUsers, activeUsers });
});

opsRouter.get('/ai-usage', async (c) => {
  const from = c.req.query('from');
  const to = c.req.query('to');
  const parsed = parseDateRange(from, to);
  if ('error' in parsed) {
    throw new HTTPException(400, { message: parsed.error });
  }
  const result = await getAiUsageAggregation(c.env.DB, parsed.from, parsed.to);
  return c.json(result);
});
