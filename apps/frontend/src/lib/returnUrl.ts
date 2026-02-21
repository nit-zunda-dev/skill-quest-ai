/**
 * returnUrl 検証（Task 2.2, Requirements 4.1）
 * 同一オリジンかつアプリ内パス（/app で始まる）のみ許可。無効な値は /app へフォールバックする。
 */
import { PATH_APP } from '@/lib/paths';

/**
 * pathname がアプリ内パス（/app または /app/ で始まる）かどうか。
 * /appetizer 等は許可しない。
 */
function isAppInternalPath(pathname: string): boolean {
  return pathname === PATH_APP || pathname.startsWith(PATH_APP + '/');
}

/**
 * リダイレクト先として許可する returnUrl を返す。
 * アプリ内パスの場合のみ pathname + search を返し、それ以外は PATH_APP を返す。
 */
export function getValidReturnUrl(pathname: string, search: string): string {
  const path = isAppInternalPath(pathname) ? pathname + search : PATH_APP;
  return path;
}
