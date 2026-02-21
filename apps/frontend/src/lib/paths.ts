/**
 * アプリ全体で用いるパス定数（Task 1.1, Requirements 1.1, 5.2）
 * ランディング・ログイン・Genesis・アプリ（ダッシュボード）の正規形を単一に定め、
 * ガードやナビゲーションから参照する。
 */
export const PATH_LANDING = '/' as const;
export const PATH_LOGIN = '/login' as const;
export const PATH_GENESIS = '/genesis' as const;
export const PATH_APP = '/app' as const;

export const PATH_APP_QUESTS = '/app/quests' as const;
export const PATH_APP_GRIMOIRE = '/app/grimoire' as const;
export const PATH_APP_PARTNER = '/app/partner' as const;
export const PATH_APP_ITEMS = '/app/items' as const;
