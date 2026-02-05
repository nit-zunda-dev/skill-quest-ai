import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import type { Bindings } from './types';
import { setupMiddleware } from './middleware';
import { auth } from './auth';
import { authMiddleware } from './middleware/auth';

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

/**
 * 認証ルートハンドラ
 * 公式ドキュメント（Honoの例）に従い、appに直接マウント
 * https://www.better-auth.com/docs/installation
 * 
 * Better Authのエンドポイント例:
 * - POST /api/auth/sign-up/email
 * - POST /api/auth/sign-in/email
 * - GET /api/auth/session
 * - POST /api/auth/sign-out
 */
app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  // データベース接続の確認
  if (!c.env?.DB) {
    return c.json({ error: 'Database binding not available' }, 500);
  }
  
  // リクエストごとにBetter Authインスタンスを生成
  // Cloudflare Workersでは、環境変数はリクエスト時にのみアクセス可能
  const authInstance = auth(c.env, c.req.raw);
  
  // Better Authのハンドラーにリクエストを渡す
  // 公式ドキュメント: auth.handler(c.req.raw)
  return authInstance.handler(c.req.raw);
});

// 認証が必要なエンドポイントのテスト用ルート
// 認証ミドルウェアの動作確認用
app.get('/api/test-protected', authMiddleware, (c) => {
  // 認証済みユーザー情報を取得
  const user = c.get('user');
  return c.json({
    message: 'This is a protected endpoint',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

/**
 * アカウント削除エンドポイント
 * 認証済みユーザーのアカウントを削除する
 */
app.post('/api/account/delete', authMiddleware, async (c) => {
  const user = c.get('user');
  
  try {
    // Better Authのデータベースからユーザーを削除
    // 関連するセッション、アカウント情報も削除される（外部キー制約による）
    await c.env.DB.prepare('DELETE FROM user WHERE id = ?').bind(user.id).run();
    
    return c.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    throw new HTTPException(500, { message: 'Failed to delete account' });
  }
});

// AppTypeをエクスポート（フロントエンドで型推論に使用）
export type AppType = typeof app;
export default app;
