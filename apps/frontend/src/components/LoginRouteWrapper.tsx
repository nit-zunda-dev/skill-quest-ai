import React, { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LoginSignupForm from '@/components/LoginSignupForm';
import { useAuth } from '@/hooks/useAuth';
import { PATH_ACCOUNT, PATH_LANDING } from '@/lib/paths';
import { getValidReturnUrl } from '@/lib/returnUrl';
import { normalizeLoginMode } from '@/lib/loginParams';

const REDIRECT_PATH_MAP: Record<string, string> = {
  [PATH_ACCOUNT]: PATH_ACCOUNT,
  [PATH_LANDING]: PATH_LANDING,
};

function sanitizeSearch(search: string): string {
  if (!search.startsWith('?')) return '';
  const rest = search.slice(1).replace(/[^0-9a-zA-Z&=_.-]/g, '');
  return rest.length > 0 ? '?' + rest : '';
}

function safeRedirectDestination(pathname: string, search: string): string {
  const basePath = REDIRECT_PATH_MAP[pathname] ?? PATH_ACCOUNT;
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
