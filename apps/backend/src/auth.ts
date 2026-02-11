import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/d1';
import type { Bindings } from './types';
import { schema } from './db/schema';
import { hashPassword, verifyPassword } from './lib/password';

/**
 * Better Authのオンデマンド初期化関数
 * Cloudflare Workers環境では、リクエストごとに環境変数とバインディングにアクセスする必要があるため、
 * この関数を呼び出して認証インスタンスを生成する
 * 
 * 公式ドキュメント: https://www.better-auth.com/docs/installation
 * 
 * @param env - Cloudflare Workersの環境変数とバインディング
 * @param request - リクエストオブジェクト（baseURL取得用）
 * @returns Better Authインスタンス
 */
export const auth = (env: Bindings, request?: Request) => {
  // Drizzle ORMインスタンスを作成
  const db = drizzle(env.DB, { schema });

  // baseURLを決定
  // リクエストから取得するか、環境変数から取得
  let baseURL = env.BETTER_AUTH_BASE_URL;
  if (!baseURL && request) {
    const url = new URL(request.url);
    baseURL = `${url.protocol}//${url.host}`;
  }
  if (!baseURL) {
    // フォールバック: ローカル開発環境
    baseURL = 'http://localhost:8787';
  }

  // trustedOrigins: 環境変数 FRONTEND_URL を元にリストを組み立て（末尾スラッシュあり/なしの両方を含める）
  const frontendOrigin = env.FRONTEND_URL || 'http://localhost:5173';
  const trustedOrigins = [
      frontendOrigin,
      frontendOrigin.endsWith('/') ? frontendOrigin.slice(0, -1) : `${frontendOrigin}/`,
      'http://localhost:5173',
      'http://localhost:8787',
    ].filter((url, i, arr) => arr.indexOf(url) === i); // 重複除去

  // HTTPS のときはクロスオリジンで Cookie を送るため SameSite=None（本番の Pages ↔ Workers）
  const isSecure = baseURL.startsWith('https');
  const useSecureCookies = isSecure;
  const defaultCookieAttributes = isSecure
    ? { sameSite: 'none' as const, secure: true }
    : { sameSite: 'lax' as const, secure: false };

  // Better Authを初期化
  // 公式ドキュメントに従い、basePathはデフォルト（/api/auth）を使用
  const authInstance = betterAuth({
    baseURL,
    // basePathはデフォルトで'/api/auth'なので設定不要
    database: drizzleAdapter(db, {
      provider: 'sqlite',
    }),
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // 初期実装ではメール確認を省略可能
      // Cloudflare Workers Free プラン（CPU 10ms 制限）対応:
      // デフォルトの scrypt は CPU 集約型で 10ms を超えやすいため、
      // Web Crypto API の PBKDF2（SHA-256, 100,000 iterations）に置き換え
      password: {
        hash: hashPassword,
        verify: verifyPassword,
      },
    },
    trustedOrigins,
    advanced: {
      // PostmanなどのAPIテストツール用にCSRFチェックを無効化（開発環境のみ推奨）
      disableCSRFCheck: true,
      useSecureCookies,
      defaultCookieAttributes,
    },
  });

  return authInstance;
};

// 型エクスポート（認証ミドルウェアで使用）
export type Auth = ReturnType<typeof auth>;
