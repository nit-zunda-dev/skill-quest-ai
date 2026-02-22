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
    title: `退屈なTODOを、自分だけの物語に | ${APP_NAME}`,
    description: '目標を入力するだけでクエストが生成され、クリアするたびにAIが物語と報酬を届ける。AIパートナーと一緒に、自分だけの冒険を始めよう。',
  },
  [PATH_LOGIN]: {
    title: `ログイン・サインアップ | ${APP_NAME}`,
    description: 'Skill Quest AI にログインまたは新規登録して、あなただけの冒険を始めましょう。',
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

/** XSS 対策: DOM に流す前に pathname を安全な文字のみに制限する（location.pathname 用に export） */
export function sanitizePathname(pathname: string): string {
  const sanitized = pathname.replace(/[^/a-zA-Z0-9\-_.]/g, '');
  return sanitized.length > 0 ? sanitized : '/';
}

/**
 * パスに対応するメタ情報を返す。公開ルートは一意な title/description、非公開は汎用＋noindex。
 * location.pathname はサニタイズしてから使用し、DOM への XSS を防ぐ。
 */
export function getRouteMeta(pathname: string): RouteMetaEntry {
  const safePath = sanitizePathname(pathname);
  const exact = PUBLIC_META[safePath];
  if (exact) return exact;
  if (safePath === PATH_APP || safePath.startsWith(`${PATH_APP}/`)) return PRIVATE_META;
  if (safePath === PATH_GENESIS || safePath.startsWith(`${PATH_GENESIS}/`)) return PRIVATE_META;
  return PRIVATE_META;
}
