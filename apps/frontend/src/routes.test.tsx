import React from 'react';
import { describe, it, expect } from 'vitest';
import { routeConfig } from '@/routes';
import {
  PATH_LANDING,
  PATH_LOGIN,
  PATH_GENESIS,
  PATH_APP_LEGACY,
  PATH_ACCOUNT,
} from '@/lib/paths';

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

describe('routeConfig', () => {
  it('defines landing, login, account, legacy redirects, catch-all', () => {
    const paths = routeConfig.map((r) => r.path).filter(Boolean);
    expect(paths).toContain(PATH_LANDING);
    expect(paths).toContain(PATH_LOGIN);
    expect(paths).toContain(PATH_ACCOUNT);
    expect(paths).toContain(PATH_GENESIS);
    expect(paths).toContain(`${PATH_GENESIS}/*`);
    expect(paths).toContain(PATH_APP_LEGACY);
    expect(paths).toContain(`${PATH_APP_LEGACY}/*`);
    expect(paths).toContain('*');
  });

  it('account route has index child', () => {
    const account = findRouteByPath(routeConfig, PATH_ACCOUNT);
    expect(account?.children?.length).toBeGreaterThan(0);
    const indexChild = (account?.children as { index?: boolean }[]).find((c) => c.index);
    expect(indexChild).toBeDefined();
  });
});
