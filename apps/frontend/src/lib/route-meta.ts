/**
 * ルート別メタ設定（Task 7.1, Requirements 3.1, 3.2, 3.4）
 * 公開ルートは一意な title と description、非公開は汎用 title と noindex。
 */
import { PATH_LANDING, PATH_LOGIN, PATH_APP, PATH_GENESIS } from './paths';

export type RouteMetaEntry = {
  title: string;
  description?: string;
  noindex?: boolean;
};

const APP_NAME = 'Skill Quest AI';

/** 公開ルート用の一意なメタ */
const PUBLIC_META: Record<string, RouteMetaEntry> = {
  [PATH_LANDING]: {
    title: `冒険を始めよう | ${APP_NAME}`,
    description: 'タスク管理とRPG要素を融合した、AIが一人ひとりに合わせた物語を紡ぐ冒険体験。',
  },
  [PATH_LOGIN]: {
    title: `ログイン・サインアップ | ${APP_NAME}`,
    description: 'Skill Quest AI にログインまたは新規登録して冒険を始めましょう。',
  },
};

/** 非公開ルート用の汎用メタ（機密を含めず noindex） */
const PRIVATE_META: RouteMetaEntry = {
  title: APP_NAME,
  noindex: true,
};

/** 404 用メタ（Task 13.1, Requirements 5.1） */
export const NOT_FOUND_META: RouteMetaEntry = {
  title: `ページが見つかりません | ${APP_NAME}`,
  description: 'お探しのページは見つかりませんでした。',
  noindex: true,
};

/**
 * パスに対応するメタ情報を返す。公開ルートは一意な title/description、非公開は汎用＋noindex。
 */
export function getRouteMeta(pathname: string): RouteMetaEntry {
  const exact = PUBLIC_META[pathname];
  if (exact) return exact;
  if (pathname === PATH_APP || pathname.startsWith(`${PATH_APP}/`)) return PRIVATE_META;
  if (pathname === PATH_GENESIS || pathname.startsWith(`${PATH_GENESIS}/`)) return PRIVATE_META;
  return PRIVATE_META;
}
