/**
 * アプリ全体のルートツリー定義（Task 1.2, Requirements 1.1, 1.5）
 * 公開（/, /login）、Genesis（/genesis, /genesis/:step）、認証必須（/app とその子）、
 * 未定義パス用キャッチオールをパスベースで一貫して定義する。
 * 8.1 で createBrowserRouter(routeConfig) によりマウントする。
 */
import React from 'react';
import type { RouteObject } from 'react-router-dom';
import {
  PATH_LANDING,
  PATH_LOGIN,
  PATH_GENESIS,
  PATH_APP,
} from '@/lib/paths';
import { GenesisLayout } from '@/layouts/GenesisLayout';
import { LoginRouteWrapper } from '@/components/LoginRouteWrapper';

/** プレースホルダー: 8.1 でルーター統合時に実コンポーネントに差し替える */
const Placeholder: React.FC<{ name: string }> = ({ name }) => (
  <div data-testid={`route-placeholder-${name}`}>{name}</div>
);

/** プレースホルダー: 6.1 で NotFoundPage に差し替える */
const NotFoundPlaceholder = () => (
  <Placeholder name="NotFound" />
);

/** ダッシュボード用レイアウト・ページのプレースホルダー（9.1 で AppLayout + 各 Page に接続） */
const AppLayoutPlaceholder = () => <Placeholder name="AppLayout" />;
const HomePlaceholder = () => <Placeholder name="Home" />;
const QuestBoardPlaceholder = () => <Placeholder name="QuestBoard" />;
const GrimoirePlaceholder = () => <Placeholder name="Grimoire" />;
const PartnerPlaceholder = () => <Placeholder name="Partner" />;
const ItemsPlaceholder = () => <Placeholder name="Items" />;

/** createBrowserRouter に渡すルート配列 */
export const routeConfig: RouteObject[] = [
  {
    path: PATH_LANDING,
    element: <Placeholder name="Landing" />,
  },
  {
    path: PATH_LOGIN,
    element: <LoginRouteWrapper />,
  },
  {
    path: PATH_GENESIS,
    element: <GenesisLayout />,
    children: [
      {
        path: ':step',
        element: <Placeholder name="GenesisStep" />,
      },
    ],
  },
  {
    path: PATH_APP,
    element: <AppLayoutPlaceholder />,
    children: [
      {
        index: true,
        element: <HomePlaceholder />,
      },
      {
        path: 'quests',
        element: <QuestBoardPlaceholder />,
      },
      {
        path: 'grimoire',
        element: <GrimoirePlaceholder />,
      },
      {
        path: 'partner',
        element: <PartnerPlaceholder />,
      },
      {
        path: 'items',
        element: <ItemsPlaceholder />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPlaceholder />,
  },
];
