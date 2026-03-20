import { PATH_LANDING, PATH_LOGIN, PATH_ACCOUNT } from './paths';

export type RouteMetaEntry = {
  title: string;
  description?: string;
  noindex?: boolean;
};

const APP_NAME = 'Skill Quest AI';

const PUBLIC_META: Record<string, RouteMetaEntry> = {
  [PATH_LANDING]: {
    title: `${APP_NAME}`,
    description: '学習用ミニアプリのポータル（準備中）。アカウントの作成・管理ができます。',
  },
  [PATH_LOGIN]: {
    title: `ログイン・サインアップ | ${APP_NAME}`,
    description: 'ログインまたは新規登録',
  },
};

const PRIVATE_META: RouteMetaEntry = {
  title: APP_NAME,
  noindex: true,
};

export const NOT_FOUND_META: RouteMetaEntry = {
  title: `ページが見つかりません | ${APP_NAME}`,
  description: 'お探しのページは見つかりませんでした。',
  noindex: true,
};

export function sanitizePathname(pathname: string): string {
  const sanitized = pathname.replace(/[^/a-zA-Z0-9\-_.]/g, '');
  return sanitized.length > 0 ? sanitized : '/';
}

export function getRouteMeta(pathname: string): RouteMetaEntry {
  const safePath = sanitizePathname(pathname);
  const exact = PUBLIC_META[safePath];
  if (exact) return exact;
  if (safePath === PATH_ACCOUNT || safePath.startsWith(`${PATH_ACCOUNT}/`)) return PRIVATE_META;
  return PRIVATE_META;
}
