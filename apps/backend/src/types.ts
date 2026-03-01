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
  AI_GATEWAY_ID?: string;
  /** 統合テスト用: '1' のとき AI をスタブし本番を呼ばない */
  INTEGRATION_TEST_AI_STUB?: string;
  /** 無料枠フォールバック: この値（Neurons 概算）以上でスタブに切り替える。未設定時はフォールバック判定を行わない */
  AI_NEURONS_FALLBACK_THRESHOLD?: string;
  /** 無料枠: 日次上限（Neurons 概算）のオプション。未設定時は閾値のみで判定 */
  AI_NEURONS_DAILY_LIMIT?: string;
  /** 運用者 API 認可用。X-Ops-API-Key と照合。未設定時は /api/ops は 404 */
  OPS_API_KEY?: string;
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