/**
 * Genesis 完了必須ガード（Task 3.1, 10.2, Requirements 1.3, 4.2, 4.3）
 * 認証済みユーザーのうち、Genesis 未完了の場合は /genesis へリダイレクトする。
 * location.state に fromGenesis と profile がある場合は Genesis 完了直後として子を表示する。
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useGenesisOrProfile } from '@/hooks/useGenesisOrProfile';
import { PATH_GENESIS } from '@/lib/paths';

type RequireGenesisProps = {
  children: React.ReactNode;
};

export function RequireGenesis({ children }: RequireGenesisProps) {
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const state = useGenesisOrProfile({ isAuthenticated, isLoading: authLoading });

  if (location.state?.fromGenesis === true && location.state?.profile != null) {
    return <>{children}</>;
  }

  if (state.kind === 'loading') {
    return (
      <div className="app-root min-h-screen bg-background text-foreground flex items-center justify-center" data-worldview="arcane-terminal">
        <div className="text-muted-foreground animate-pulse">読み込み中...</div>
      </div>
    );
  }

  if (state.kind === 'genesis') {
    return <Navigate to={PATH_GENESIS} replace />;
  }

  if (state.kind === 'error') {
    return (
      <div className="app-root min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4" data-worldview="arcane-terminal">
        <p className="text-destructive" role="alert">
          {state.message}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
