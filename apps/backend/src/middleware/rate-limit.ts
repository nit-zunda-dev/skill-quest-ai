import type { Context, Next } from 'hono';
import type { Bindings, AuthUser } from '../types';
import { HTTPException } from 'hono/http-exception';

/**
 * レート制限の設定
 * - 時間窓: 1分（60秒）
 * - 最大リクエスト数: 10回/分
 */
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1分
const RATE_LIMIT_MAX_REQUESTS = 10; // 1分あたり10回まで

/**
 * レート制限ミドルウェア
 * AIエンドポイント用の短時間レート制限（連打防止）を実装する
 * 
 * 動作:
 * - ユーザーIDとエンドポイントごとに1分間のリクエスト数をカウント
 * - 1分以内に10回を超えるリクエストは429エラーを返す
 * - 古いログ（1分以上前）は自動的に削除
 * 
 * 使用方法:
 * ```typescript
 * app.use('/api/ai/*', rateLimitMiddleware);
 * ```
 */
export async function rateLimitMiddleware(
  c: Context<{ Bindings: Bindings; Variables: { user: AuthUser } }>,
  next: Next
) {
  try {
    const user = c.get('user');
    const endpoint = c.req.path;
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW_MS;

    // 1分以内のリクエスト数を取得
    const stmt = c.env.DB.prepare(`
      SELECT COUNT(*) as count
      FROM rate_limit_logs
      WHERE user_id = ? AND endpoint = ? AND created_at > ?
    `);
    const result = await stmt.bind(user.id, endpoint, windowStart).first<{ count: number }>();

    const requestCount = result?.count ?? 0;

    // レート制限を超えている場合
    if (requestCount >= RATE_LIMIT_MAX_REQUESTS) {
      throw new HTTPException(429, {
        message: 'Too Many Requests: Rate limit exceeded. Please try again later.',
      });
    }

    // リクエストログを記録
    const logId = crypto.randomUUID();
    const insertStmt = c.env.DB.prepare(`
      INSERT INTO rate_limit_logs (id, user_id, endpoint, created_at)
      VALUES (?, ?, ?, ?)
    `);
    await insertStmt.bind(logId, user.id, endpoint, now).run();

    // 古いログを削除（1分以上前のログ）
    const deleteStmt = c.env.DB.prepare(`
      DELETE FROM rate_limit_logs
      WHERE created_at < ?
    `);
    await deleteStmt.bind(windowStart).run();

    // 次のミドルウェアまたはハンドラに進む
    await next();
  } catch (error) {
    // HTTPExceptionの場合はそのまま再スロー
    if (error instanceof HTTPException) {
      throw error;
    }

    // その他のエラーの場合はログに記録して続行
    console.error('Rate limit middleware error:', error);
    // エラーが発生してもリクエストは続行（レート制限の失敗は致命的ではない）
    await next();
  }
}
