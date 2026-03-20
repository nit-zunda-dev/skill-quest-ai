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
      <div className="app-root min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">読み込み中...</div>
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
