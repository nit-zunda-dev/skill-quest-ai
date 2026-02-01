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
  GITHUB_CLIENT_ID?: string;
  GITHUB_CLIENT_SECRET?: string;
  FRONTEND_URL?: string;
};

/**
 * @deprecated Use `Bindings` instead. This alias is kept for backward compatibility.
 */
export type Env = Bindings;
