/**
 * アプリ全体のルートツリー定義（Task 1.2, Requirements 1.1, 1.5）
 * 公開（/, /login）、Genesis（/genesis, /genesis/:step）、認証必須（/app とその子）、
 * 未定義パス用キャッチオールをパスベースで一貫して定義する。
 * 8.1 で createBrowserRouter(routeConfig) によりマウントする。
 * 8.2 で / と /login は App（ルート駆動のランディング・ログイン）を描画する。
 * 9.1 で /app 配下にダッシュボードレイアウトと各ページを接続。
 */
import React from 'react';
import type { RouteObject } from 'react-router-dom';
import {
  PATH_LANDING,
  PATH_LOGIN,
  PATH_GENESIS,
  PATH_APP,
} from '@/lib/paths';
import App from '@/App';
import { GenesisLayout } from '@/layouts/GenesisLayout';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { RequireAuth } from '@/components/guards/RequireAuth';
import { RequireGenesis } from '@/components/guards/RequireGenesis';
import NotFoundPage from '@/pages/NotFoundPage';
import HomePage from '@/pages/HomePage';
import QuestBoardPage from '@/pages/QuestBoardPage';
import GrimoirePage from '@/pages/GrimoirePage';
import PartnerPage from '@/pages/PartnerPage';
import ItemsPage from '@/pages/ItemsPage';

/** Genesis :step 用プレースホルダー（Task 10.1 で URL 同期時に実コンポーネントに差し替え） */
const GenesisStepPlaceholder = () => (
  <div data-testid="route-placeholder-GenesisStep">GenesisStep</div>
);

/** createBrowserRouter に渡すルート配列 */
export const routeConfig: RouteObject[] = [
  {
    path: PATH_LANDING,
    element: <App />,
  },
  {
    path: PATH_LOGIN,
    element: <App />,
  },
  {
    path: PATH_GENESIS,
    element: <GenesisLayout />,
    children: [
      {
        path: ':step',
        element: <GenesisStepPlaceholder />,
      },
    ],
  },
  {
    path: PATH_APP,
    element: (
      <RequireAuth>
        <RequireGenesis>
          <DashboardLayout />
        </RequireGenesis>
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'quests',
        element: <QuestBoardPage />,
      },
      {
        path: 'grimoire',
        element: <GrimoirePage />,
      },
      {
        path: 'partner',
        element: <PartnerPage />,
      },
      {
        path: 'items',
        element: <ItemsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];
