/**
 * ログイン/サインアップルート用ラッパー（Task 5.1, 12.1 / Requirements 4.1, 5.3）
 * URL の returnUrl を取得し、認証成功後に有効ならその URL へ、無効または無ければダッシュボードへ遷移する。
 * mode と returnUrl の無効・欠落値をデフォルトに正規化する。
 */
import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LoginSignupForm from '@/components/LoginSignupForm';
import { useAuth } from '@/hooks/useAuth';
import {
  PATH_APP,
  PATH_APP_QUESTS,
  PATH_APP_GRIMOIRE,
  PATH_APP_PARTNER,
  PATH_APP_ITEMS,
} from '@/lib/paths';
import { getValidReturnUrl } from '@/lib/returnUrl';
import { normalizeLoginMode } from '@/lib/loginParams';

/** リダイレクト許可パス → 定数（navigate には定数由来の文字列のみ渡して Open Redirect を防ぐ） */
const REDIRECT_PATH_MAP: Record<string, string> = {
  [PATH_APP]: PATH_APP,
  [PATH_APP_QUESTS]: PATH_APP_QUESTS,
  [PATH_APP_GRIMOIRE]: PATH_APP_GRIMOIRE,
  [PATH_APP_PARTNER]: PATH_APP_PARTNER,
  [PATH_APP_ITEMS]: PATH_APP_ITEMS,
};

/** クエリ文字列を安全な文字だけに制限 */
function sanitizeSearch(search: string): string {
  if (!search.startsWith('?')) return '';
  const rest = search.slice(1).replace(/[^0-9a-zA-Z&=_.-]/g, '');
  return rest.length > 0 ? '?' + rest : '';
}

/** Open Redirect 対策: 許可パス定数 + サニタイズした search のみを返す（ユーザー入力の文字列は渡さない） */
function safeRedirectDestination(pathname: string, search: string): string {
  const basePath = REDIRECT_PATH_MAP[pathname] ?? PATH_APP;
  return basePath + sanitizeSearch(search);
}

export function LoginRouteWrapper() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refetch } = useAuth();

  const rawMode = searchParams.get('mode');
  const rawReturnUrl = searchParams.get('returnUrl') ?? '';
  const pathname = rawReturnUrl.includes('?')
    ? rawReturnUrl.slice(0, rawReturnUrl.indexOf('?'))
    : rawReturnUrl;
  const search = rawReturnUrl.includes('?')
    ? rawReturnUrl.slice(rawReturnUrl.indexOf('?'))
    : '';

  const normalizedMode = normalizeLoginMode(rawMode);
  const validReturnUrl = getValidReturnUrl(pathname, search);
  const returnUrlIsInvalid = rawReturnUrl !== '' && validReturnUrl !== pathname + search;
  const modeIsInvalid = rawMode != null && rawMode !== '' && normalizedMode !== rawMode;

  useEffect(() => {
    if (!modeIsInvalid && !returnUrlIsInvalid) return;
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (modeIsInvalid) {
        if (normalizedMode === 'login') next.delete('mode');
        else next.set('mode', normalizedMode);
      }
      if (returnUrlIsInvalid) next.delete('returnUrl');
      return next;
    });
  }, [modeIsInvalid, returnUrlIsInvalid, normalizedMode, setSearchParams]);

  const handleSuccess = () => {
    refetch();
    navigate(safeRedirectDestination(pathname, search));
  };

  return <LoginSignupForm onSuccess={handleSuccess} initialMode={normalizedMode} />;
}
