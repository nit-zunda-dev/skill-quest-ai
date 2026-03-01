import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Bindings } from './types';
import { setupMiddleware } from './middleware';
import { auth } from './auth';
import { authMiddleware } from './middleware/auth';
import { rateLimitMiddleware } from './middleware/rate-limit';
import { questsRouter } from './routes/quests';
import { aiRouter } from './routes/ai';
import { profileRouter } from './routes/profile';
import { grimoireRouter } from './routes/grimoire';
import { itemsRouter } from './routes/items';
import { partnerRouter } from './routes/partner';
import { healthRouter } from './routes/health';
import { deleteAccountByUserId } from './services/account-delete';

const userIdParamSchema = z.object({
  userId: z.string().min(1, 'ユーザーIDは必須です'),
});

// Honoアプリケーションを初期化
// Bindings型を適用して、c.envで型安全にアクセスできるようにする
const app = new Hono<{ Bindings: Bindings }>();

// 共通ミドルウェアを適用（CORS、ロギング、エラーハンドリング）
setupMiddleware(app);

// 基本的なルート
app.get('/', (c) => {
  return c.json({ message: 'Skill Quest AI Backend API' });
});

// ヘルスチェック（認証なし・外形監視用）Task 3.1
app.route('/api/health', healthRouter);

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

// クエスト管理ルート（認証必須）
app.use('/api/quests/*', authMiddleware);
app.route('/api/quests', questsRouter);

// AI生成ルート（認証必須・レート制限・利用制限は各ハンドラで実施）
app.use('/api/ai/*', authMiddleware);
app.use('/api/ai/*', rateLimitMiddleware);
app.route('/api/ai', aiRouter);

// プロフィールルート（認証必須）
app.use('/api/profile/*', authMiddleware);
app.route('/api/profile', profileRouter);

// グリモワールルート（認証必須）
app.use('/api/grimoire/*', authMiddleware);
app.route('/api/grimoire', grimoireRouter);

// 所持アイテム一覧ルート（認証必須）
app.use('/api/items/*', authMiddleware);
app.route('/api/items', itemsRouter);

// パートナー・バー関連（認証必須）
app.use('/api/partner/*', authMiddleware);
app.route('/api/partner', partnerRouter);

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
 * ユーザーIDを指定し、認証済みユーザー本人のみ自分のアカウントと関連する全データを削除できる。
 * DELETE /api/users/:userId — :userId は認証ユーザーの id と一致している必要がある。
 */
app.delete(
  '/api/users/:userId',
  authMiddleware,
  zValidator('param', userIdParamSchema),
  async (c) => {
    const user = c.get('user');
    const { userId } = c.req.valid('param');

    if (userId !== user.id) {
      throw new HTTPException(403, { message: 'Forbidden: You can only delete your own account' });
    }

    try {
      await deleteAccountByUserId(c.env.DB, userId);
      return c.json({ success: true, message: 'Account and all related data deleted successfully' });
    } catch (error) {
      if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
        throw new HTTPException(404, { message: 'User not found' });
      }
      console.error('Account deletion error:', error);
      throw new HTTPException(500, { message: 'Failed to delete account' });
    }
  }
);

// AppTypeをエクスポート（フロントエンドで型推論に使用）
export type AppType = typeof app;
export default app;
