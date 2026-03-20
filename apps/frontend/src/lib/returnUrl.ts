/**
 * returnUrl 検証: 同一オリジン想定で、アプリ内パス（/account）のみ許可。
 */
import { PATH_ACCOUNT } from '@/lib/paths';

function isAccountInternalPath(pathname: string): boolean {
  return pathname === PATH_ACCOUNT || pathname.startsWith(`${PATH_ACCOUNT}/`);
}

export function getValidReturnUrl(pathname: string, search: string): string {
  return isAccountInternalPath(pathname) ? pathname + search : PATH_ACCOUNT;
}
