/**
 * 認証状態管理フック（タスク 10.3）
 * - アプリ起動時に getSession でセッションを取得
 * - 認証状態に基づくルーティング用に isAuthenticated / isLoading を提供
 * - ログアウト用 signOut を提供
 * - AuthProvider で状態を共有し、サインアウト時に全コンポーネントでログイン画面へ遷移
 */
import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { getSession, signOut as authSignOut } from '@/lib/auth-client';

export type SessionData = { user: { id: string; email?: string; name?: string }; session: { id: string; token: string; expiresAt: number } } | null;

const SESSION_FETCH_TIMEOUT_MS = 12_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Session fetch timeout')), ms)
    ),
  ]);
}

type AuthContextValue = {
  session: SessionData | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
  refetch: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refetch = useCallback(() => {
    setIsLoading(true);
    withTimeout(getSession(), SESSION_FETCH_TIMEOUT_MS)
      .then((res) => {
        if (res?.data) {
          // better-authのgetSessionはDate型のexpiresAtを返すが、SessionDataはnumber型を期待
          const sessionData: SessionData = {
            user: {
              id: res.data.user.id,
              email: res.data.user.email,
              name: res.data.user.name,
            },
            session: {
              id: res.data.session.id,
              token: res.data.session.token,
              expiresAt: res.data.session.expiresAt instanceof Date 
                ? res.data.session.expiresAt.getTime() 
                : typeof res.data.session.expiresAt === 'number'
                ? res.data.session.expiresAt
                : 0,
            },
          };
          setSession(sessionData);
        } else {
          setSession(null);
        }
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

  const value: AuthContextValue = {
    session,
    isLoading,
    isAuthenticated: session != null,
    signOut,
    refetch,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx == null) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
