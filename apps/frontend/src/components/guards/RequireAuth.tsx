/**
 * 認証必須ガード（Task 2.1, 2.2, Requirements 1.2, 4.1, 4.4）
 * 未認証の場合は /login へリダイレクトし、returnUrl を付与する。
 * returnUrl は同一オリジンかつアプリ内パスのみ許可し、無効な場合は /app へフォールバックする。
 */
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PATH_LOGIN } from '@/lib/paths';
import { getValidReturnUrl } from '@/lib/returnUrl';

type RequireAuthProps = {
  children: React.ReactNode;
};

export function RequireAuth({ children }: RequireAuthProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">読み込み中...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const returnUrl = getValidReturnUrl(location.pathname, location.search);
    const to = `${PATH_LOGIN}?returnUrl=${encodeURIComponent(returnUrl)}`;
    return <Navigate to={to} replace />;
  }

  return <>{children}</>;
}
