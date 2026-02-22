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
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">読み込み中...</div>
      </div>
    );
  }

  if (state.kind === 'genesis') {
    return <Navigate to={PATH_GENESIS} replace />;
  }

  if (state.kind === 'error') {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 flex flex-col items-center justify-center p-4">
        <p className="text-red-400" role="alert">
          {state.message}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
