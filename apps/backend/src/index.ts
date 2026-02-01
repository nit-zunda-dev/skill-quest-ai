import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Bindings } from './types';
import { setupMiddleware } from './middleware';

// Honoアプリケーションを初期化
// Bindings型を適用して、c.envで型安全にアクセスできるようにする
const app = new Hono<{ Bindings: Bindings }>();

// 共通ミドルウェアを適用（CORS、ロギング、エラーハンドリング）
setupMiddleware(app);

// 基本的なルート（ヘルスチェック）
app.get('/', (c) => {
  return c.json({ message: 'Skill Quest AI Backend API' });
});

// バインディングの型安全性を確認するテストルート
app.get('/test-bindings', (c) => {
  // 型チェック: c.envにアクセスできることを確認
  const hasDB = !!c.env.DB;
  const hasAI = !!c.env.AI;
  const hasAuthSecret = !!c.env.BETTER_AUTH_SECRET;
  
  return c.json({
    bindingsAvailable: {
      DB: hasDB,
      AI: hasAI,
      BETTER_AUTH_SECRET: hasAuthSecret,
    },
  });
});

// エラーハンドリングのテストルート
app.get('/test-error', (c) => {
  throw new HTTPException(400, { message: 'Test error for error handler' });
});

// CORSヘッダーの確認用ルート
app.get('/test-cors', (c) => {
  return c.json({
    message: 'CORS headers should be set',
    headers: {
      'Access-Control-Allow-Credentials': c.res.headers.get('Access-Control-Allow-Credentials'),
    },
  });
});

// AppTypeをエクスポート（フロントエンドで型推論に使用）
export type AppType = typeof app;
export default app;
