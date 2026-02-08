/**
 * 認証状態管理フック（タスク 10.3）
 * - アプリ起動時に getSession でセッションを取得
 * - 認証状態に基づくルーティング用に isAuthenticated / isLoading を提供
 * - ログアウト用 signOut を提供
 */
import { useState, useEffect, useCallback } from 'react';
import { getSession, signOut as authSignOut } from '@/lib/auth-client';

type SessionData = { user: { id: string; email?: string; name?: string }; session: { id: string; token: string; expiresAt: number } } | null;

const SESSION_FETCH_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Session fetch timeout')), ms)
    ),
  ]);
}

export function useAuth() {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(() => {
    setIsLoading(true);
    withTimeout(getSession(), SESSION_FETCH_TIMEOUT_MS)
      .then((res: { data?: SessionData }) => {
        setSession(res?.data ?? null);
      })
      .catch(() => setSession(null))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const signOut = useCallback(async () => {
    await authSignOut();
    setSession(null);
  }, []);

  return {
    session,
    isLoading,
    isAuthenticated: session != null,
    signOut,
    refetch,
  };
}
