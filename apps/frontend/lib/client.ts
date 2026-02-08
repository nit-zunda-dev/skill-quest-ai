/**
 * Hono RPC クライアント
 * タスク 8.1: 型安全なAPI通信のためのクライアント初期化
 *
 * - import type で AppType を型のみインポート
 * - 環境変数 VITE_API_URL から API URL を取得
 * - credentials: 'include' で Cookie ベース認証をサポート
 */
import { hc } from 'hono/client';
import type { AppType } from '@skill-quest/backend';

const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8787';

export const client = hc<AppType>(apiUrl, {
  init: {
    credentials: 'include',
  },
});
