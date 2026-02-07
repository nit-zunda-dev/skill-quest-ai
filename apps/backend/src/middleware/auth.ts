import type { Context, Next } from 'hono';
import type { Bindings, AuthUser } from '../types';
import { auth } from '../auth';
import { HTTPException } from 'hono/http-exception';

/**
 * 認証ミドルウェア
 * 認証が必要なエンドポイントでセッションを検証し、ユーザー情報をコンテキストに注入する
 * 
 * 使用方法:
 * ```typescript
 * app.use('/api/protected/*', authMiddleware);
 * ```
 */
export async function authMiddleware(
  c: Context<{ Bindings: Bindings; Variables: { user: AuthUser } }>,
  next: Next
) {
  try {
    // Better Authインスタンスを生成
    // リクエストオブジェクトを渡してbaseURLを決定
    const betterAuth = auth(c.env, c.req.raw);
    
    // セッションを取得
    // Better AuthのAPIを使用してセッションを検証
    // リクエストオブジェクトからセッションを取得
    const sessionResponse = await betterAuth.api.getSession({
      headers: c.req.raw.headers,
    });
    
    // セッションが存在しない、または無効な場合
    if (!sessionResponse || !sessionResponse.user) {
      throw new HTTPException(401, {
        message: 'Unauthorized: Authentication required',
      });
    }
    
    const user = sessionResponse.user;
    
    // ユーザー情報をコンテキストに注入
    c.set('user', {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image || null,
    });
    
    // 次のミドルウェアまたはハンドラに進む
    await next();
  } catch (error) {
    // HTTPExceptionの場合はそのまま再スロー
    if (error instanceof HTTPException) {
      throw error;
    }
    
    // その他のエラーの場合は401を返す
    console.error('Auth middleware error:', error);
    throw new HTTPException(401, {
      message: 'Unauthorized: Authentication failed',
    });
  }
}
