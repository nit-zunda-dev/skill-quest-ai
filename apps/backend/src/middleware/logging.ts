import type { Context, Next } from 'hono';
import type { Bindings } from '../types';

/**
 * ロギングミドルウェア
 * リクエスト情報（メソッド、パス、ステータスコード、レスポンス時間）を記録する
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

  // レスポンス情報をログに記録
  const duration = Date.now() - start;
  const status = c.res.status;
  console.log(
    `[${new Date().toISOString()}] ${method} ${path} - ${status} - ${duration}ms`
  );
}
