/**
 * ログイン/サインアップのクエリ正規化（Task 12.1, Requirements 5.3）
 * 無効または欠落した mode はログインをデフォルトとする。
 */
export type LoginMode = 'login' | 'signup';

const VALID_MODES: LoginMode[] = ['login', 'signup'];

/**
 * URL の mode クエリを正規化する。'login' | 'signup' のみ有効、それ以外は 'login'。
 */
export function normalizeLoginMode(mode: string | null | undefined): LoginMode {
  if (mode != null && (VALID_MODES as readonly string[]).includes(mode)) {
    return mode as LoginMode;
  }
  return 'login';
}
