import type { D1Database } from '@cloudflare/workers-types';

/**
 * Cloudflare Workers の環境変数とバインディング（認証・プロフィール用ミニマル構成）
 */
export type Bindings = {
  DB: D1Database;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_BASE_URL?: string;
  FRONTEND_URL?: string;
  /** 運用者 API。未設定時は /api/ops は 404 */
  OPS_API_KEY?: string;
};

/** @deprecated Use `Bindings` instead. */
export type Env = Bindings;

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  image?: string | null;
}
