import type { Context, Next } from 'hono';
import type { Bindings } from '../types';
import { logStructured } from '../lib/structured-log';

/**
 * ロギングミドルウェア
 * リクエスト情報（メソッド、パス、ステータスコード、レスポンス時間）を構造化ログで記録する（Task 4.2）
 */
export async function loggingMiddleware(
  c: Context<{ Bindings: Bindings }>,
  next: Next
) {
  const start = Date.now();
  const method = c.req.method;
  const path = c.req.path;
  const userAgent = c.req.header('user-agent') || 'unknown';

  // リクエスト開始ログ
  console.log(`[${new Date().toISOString()}] ${method} ${path} - ${userAgent}`);

  await next();

  const durationMs = Date.now() - start;
  const status = c.res.status;
  logStructured({
    level: 'info',
    msg: 'request',
    path,
    method,
    status,
    durationMs,
  });
}
