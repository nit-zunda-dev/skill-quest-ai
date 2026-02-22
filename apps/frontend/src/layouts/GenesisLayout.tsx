/**
 * Genesis 用ルートの親レイアウト（Task 4.1, 10.1, 13.1）
 * 認証済みかつ Genesis 完了済みの場合は /app へリダイレクトする。
 * それ以外は GenesisFlowProvider でラップして Outlet を表示する。ルート別メタを適用する。
 */
import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { PageMeta } from '@/components/PageMeta';
import { useAuth } from '@/hooks/useAuth';
import { useGenesisOrProfile } from '@/hooks/useGenesisOrProfile';
import { GenesisFlowProvider } from '@/contexts/GenesisFlowContext';
import { PATH_APP } from '@/lib/paths';
import { getRouteMeta } from '@/lib/route-meta';

export function GenesisLayout() {
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const state = useGenesisOrProfile({ isAuthenticated, isLoading: authLoading });

  if (isAuthenticated && state.kind === 'dashboard') {
    return <Navigate to={PATH_APP} replace />;
  }

  if (isAuthenticated && state.kind === 'loading') {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">読み込み中...</div>
      </div>
    );
  }

  return (
    <PageMeta {...getRouteMeta(location.pathname)}>
      <GenesisFlowProvider>
        <Outlet />
      </GenesisFlowProvider>
    </PageMeta>
  );
}
