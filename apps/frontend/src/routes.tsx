import React from 'react';
import type { RouteObject } from 'react-router-dom';
import { Navigate } from 'react-router-dom';
import {
  PATH_LANDING,
  PATH_LOGIN,
  PATH_ACCOUNT,
  PATH_APP_LEGACY,
  PATH_GENESIS,
} from '@/lib/paths';
import { RequireAuth } from '@/components/guards/RequireAuth';
import NotFoundPage from '@/pages/NotFoundPage';
import MinimalHomePage from '@/pages/MinimalHomePage';
import AccountPage from '@/pages/AccountPage';
import { AccountLayout } from '@/layouts/AccountLayout';
import { LoginRouteWrapper } from '@/components/LoginRouteWrapper';
import { PageMeta } from '@/components/PageMeta';
import { getRouteMeta } from '@/lib/route-meta';

function LoginPage() {
  return (
    <PageMeta {...getRouteMeta(PATH_LOGIN)}>
      <div className="app-root min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <h1 className="text-xl font-bold text-center text-foreground mb-6">Skill Quest AI</h1>
          <LoginRouteWrapper />
        </div>
        <div className="p-4 text-center text-muted-foreground text-xs mt-8">Skill Quest AI</div>
      </div>
    </PageMeta>
  );
}

function HomeWithMeta() {
  return (
    <PageMeta {...getRouteMeta(PATH_LANDING)}>
      <MinimalHomePage />
    </PageMeta>
  );
}

export const routeConfig: RouteObject[] = [
  {
    path: PATH_LANDING,
    element: <HomeWithMeta />,
  },
  {
    path: PATH_LOGIN,
    element: <LoginPage />,
  },
  {
    path: PATH_GENESIS,
    element: <Navigate to={PATH_LANDING} replace />,
  },
  {
    path: `${PATH_GENESIS}/*`,
    element: <Navigate to={PATH_LANDING} replace />,
  },
  {
    path: PATH_APP_LEGACY,
    element: <Navigate to={PATH_ACCOUNT} replace />,
  },
  {
    path: `${PATH_APP_LEGACY}/*`,
    element: <Navigate to={PATH_ACCOUNT} replace />,
  },
  {
    path: PATH_ACCOUNT,
    element: (
      <RequireAuth>
        <AccountLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <AccountPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];
