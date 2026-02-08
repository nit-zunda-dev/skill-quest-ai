import type { D1Database } from '@cloudflare/workers-types';
import type { Ai } from '@cloudflare/workers-types';

/**
 * Cloudflare Workers環境変数とバインディングの型定義
 * Honoアプリケーションのコンテキストに注入される
 */
export type Bindings = {
  DB: D1Database;
  AI: Ai;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_BASE_URL?: string;
  FRONTEND_URL?: string;
};

/**
 * @deprecated Use `Bindings` instead. This alias is kept for backward compatibility.
 */
export type Env = Bindings;

/**
 * 認証済みユーザー情報の型定義
 * Better Authのセッションから取得されるユーザー情報
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
}