import type { Hono } from 'hono';
import type { Bindings } from '../types';
import { cors } from 'hono/cors';
import { errorHandler } from './error-handler';
import { loggingMiddleware } from './logging';

/**
 * 共通ミドルウェアを適用する
 * 適用順序: CORS → ロギング → エラーハンドリング
 */
export function setupMiddleware(app: Hono<{ Bindings: Bindings }>) {
  // CORSミドルウェア: Access-Control-Allow-Credentialsを設定
  app.use(
    '*',
    cors({
      origin: (origin) => {
        // 開発環境ではすべてのオリジンを許可
        // 本番環境では環境変数から許可オリジンを取得
        return origin || '*';
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      exposeHeaders: ['Content-Length'],
      maxAge: 86400,
      credentials: true, // Access-Control-Allow-Credentials: true
    })
  );

  // ロギングミドルウェア: リクエスト情報を記録
  app.use('*', loggingMiddleware);

  // エラーハンドリングミドルウェア: 統一的なエラーレスポンス
  app.onError(errorHandler);
}
