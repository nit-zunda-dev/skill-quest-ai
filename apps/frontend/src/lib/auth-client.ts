/**
 * Better Auth クライアント（タスク 10.1）
 * - React 用クライアントを初期化
 * - signIn, signOut, getSession をエクスポート
 * - 環境変数 VITE_API_URL から API URL を取得
 */
import { createAuthClient } from 'better-auth/react';

const baseURL = import.meta.env?.VITE_API_URL || 'http://localhost:8787';

export const authClient = createAuthClient({
  baseURL,
});

export const { signIn, signOut, getSession } = authClient;
