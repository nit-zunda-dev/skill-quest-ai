/**
 * ログイン/サインアップルート用ラッパー（Task 5.1, Requirements 4.1）
 * URL の returnUrl を取得し、認証成功後に有効ならその URL へ、無効または無ければダッシュボードへ遷移する。
 */
import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import LoginSignupForm from '@/components/LoginSignupForm';
import { useAuth } from '@/hooks/useAuth';
import { getValidReturnUrl } from '@/lib/returnUrl';

export function LoginRouteWrapper() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refetch } = useAuth();

  const rawReturnUrl = searchParams.get('returnUrl') ?? '';
  const pathname = rawReturnUrl.includes('?')
    ? rawReturnUrl.slice(0, rawReturnUrl.indexOf('?'))
    : rawReturnUrl;
  const search = rawReturnUrl.includes('?')
    ? rawReturnUrl.slice(rawReturnUrl.indexOf('?'))
    : '';

  const handleSuccess = () => {
    refetch();
    const target = getValidReturnUrl(pathname, search);
    navigate(target);
  };

  return <LoginSignupForm onSuccess={handleSuccess} />;
}
