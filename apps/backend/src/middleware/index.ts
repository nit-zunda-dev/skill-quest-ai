import type { Hono } from 'hono';
import type { Bindings } from '../types';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { errorHandler } from './error-handler';
import { loggingMiddleware } from './logging';

/**
 * 共通ミドルウェアを適用する
 * 適用順序: CORS → セキュリティヘッダー → ロギング → エラーハンドリング
 */
export function setupMiddleware(app: Hono<{ Bindings: Bindings }>) {
  // CORSミドルウェア: 許可リストで検証し、credentials 時は * を返さない
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:8787',
  ];
  app.use(
    '*',
    cors({
      origin: (origin, c) => {
        const allowlist = [
          ...(c.env?.FRONTEND_URL ? [c.env.FRONTEND_URL] : []),
          ...allowedOrigins,
        ];
        if (origin && allowlist.includes(origin)) {
          return origin;
        }
        return undefined;
      },
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowHeaders: ['Content-Type', 'Authorization'],
      exposeHeaders: ['Content-Length'],
      maxAge: 86400,
      credentials: true,
    })
  );

  // セキュリティヘッダー: X-Content-Type-Options, X-Frame-Options 等
  app.use(
    '*',
    secureHeaders({
      strictTransportSecurity: false, // HSTS は下記ミドルウェアで HTTPS 時のみ付与
    })
  );

  // HSTS: リクエスト URL が HTTPS の場合のみ付与（開発環境 localhost では無効）
  app.use('*', (c, next) => {
    try {
      const url = new URL(c.req.url);
      if (url.protocol === 'https:') {
        c.header(
          'Strict-Transport-Security',
          'max-age=31536000; includeSubDomains'
        );
      }
    } catch {
      // URL パース失敗時は HSTS を付けない
    }
    return next();
  });

  // ロギングミドルウェア: リクエスト情報を記録
  app.use('*', loggingMiddleware);

  // エラーハンドリングミドルウェア: 統一的なエラーレスポンス
  app.onError(errorHandler);
}
