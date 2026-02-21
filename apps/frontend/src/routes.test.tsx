/**
 * ルートツリー定義の単体テスト（Task 1.2, Requirements 1.1, 1.5）
 * 公開（/, /login）、Genesis（/genesis, /genesis/:step）、認証必須（/app とその子）、
 * キャッチオールが一貫してパスベースで定義されていることを検証する。
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { routeConfig } from '@/routes';
import {
  PATH_LANDING,
  PATH_LOGIN,
  PATH_GENESIS,
  PATH_APP,
} from '@/lib/paths';

/** ルート配列から path で再帰的にルートを探す */
function findRouteByPath(
  routes: { path?: string; children?: unknown[] }[],
  targetPath: string
): { path?: string; children?: unknown[] } | undefined {
  for (const r of routes) {
    if (r.path === targetPath) return r;
    if (r.children?.length) {
      const found = findRouteByPath(
        r.children as { path?: string; children?: unknown[] }[],
        targetPath
      );
      if (found) return found;
    }
  }
  return undefined;
}

/** ルートの子の path を flat に収集（index は path なしのため id で判定） */
function getChildPaths(
  route: { path?: string; children?: { path?: string; index?: boolean }[] }
): string[] {
  const children = route.children ?? [];
  return children
    .filter((c) => c.path !== undefined)
    .map((c) => c.path as string);
}

describe('routeConfig (Task 1.2)', () => {
  it('defines public route for landing (/)', () => {
    const landing = findRouteByPath(routeConfig, PATH_LANDING);
    expect(landing).toBeDefined();
    expect(landing?.path).toBe(PATH_LANDING);
  });

  it('defines public route for login', () => {
    const login = findRouteByPath(routeConfig, PATH_LOGIN);
    expect(login).toBeDefined();
    expect(login?.path).toBe(PATH_LOGIN);
  });

  it('defines Genesis route and :step child', () => {
    const genesis = findRouteByPath(routeConfig, PATH_GENESIS);
    expect(genesis).toBeDefined();
    const stepChild = findRouteByPath(routeConfig, ':step');
    expect(stepChild).toBeDefined();
    const genesisChildren = (genesis as { children?: { path?: string }[] })
      .children ?? [];
    const hasStep = genesisChildren.some((c) => c.path === ':step');
    expect(hasStep).toBe(true);
  });

  it('defines app (dashboard) route with children: index, quests, grimoire, partner, items', () => {
    const app = findRouteByPath(routeConfig, PATH_APP);
    expect(app).toBeDefined();
    const childPaths = getChildPaths(
      app as { path?: string; children?: { path?: string; index?: boolean }[] }
    );
    expect(childPaths).toContain('quests');
    expect(childPaths).toContain('grimoire');
    expect(childPaths).toContain('partner');
    expect(childPaths).toContain('items');
    const children = (app as { children?: { index?: boolean }[] }).children ?? [];
    const hasIndex = children.some((c) => (c as { index?: boolean }).index === true);
    expect(hasIndex).toBe(true);
  });

  it('app route uses dashboard layout and real components, not placeholders (Task 9.1)', () => {
    const app = findRouteByPath(routeConfig, PATH_APP);
    expect(app).toBeDefined();
    expect((app as { element?: unknown }).element).toBeDefined();
    const el = (app as { element?: React.ReactElement }).element;
    const typeName = el?.type && typeof el.type === 'function' ? (el.type as { name?: string }).name : '';
    expect(typeName).not.toBe('AppLayoutPlaceholder');
    expect(typeName).not.toBe('Placeholder');
  });

  it('defines catch-all route for undefined paths', () => {
    const catchAll = findRouteByPath(routeConfig, '*');
    expect(catchAll).toBeDefined();
    expect(catchAll?.path).toBe('*');
  });

  it('uses path-based routing consistently (all top-level paths are strings)', () => {
    const paths = routeConfig.map((r) => r.path).filter(Boolean);
    expect(paths).toContain(PATH_LANDING);
    expect(paths).toContain(PATH_LOGIN);
    expect(paths).toContain(PATH_GENESIS);
    expect(paths).toContain(PATH_APP);
    expect(paths).toContain('*');
  });
});
