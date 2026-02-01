import { Hono } from 'hono';
import type { Bindings } from './types';

// Honoアプリケーションを初期化
// Bindings型を適用して、c.envで型安全にアクセスできるようにする
const app = new Hono<{ Bindings: Bindings }>();

// ミドルウェア: 環境変数とバインディングは自動的にc.envに注入される
// このミドルウェアは型安全性を確保し、バインディングが利用可能であることを保証する
app.use('*', async (c, next) => {
  // c.envにはBindings型で定義されたすべてのプロパティが含まれる
  // DB, AI, BETTER_AUTH_SECRET, GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, FRONTEND_URL
  await next();
});

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

// AppTypeをエクスポート（フロントエンドで型推論に使用）
export type AppType = typeof app;
export default app;
