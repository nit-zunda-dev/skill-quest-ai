import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PATH_ACCOUNT, PATH_LOGIN } from '@/lib/paths';

export default function MinimalHomePage() {
  const { isAuthenticated, isLoading } = useAuth();

  return (
    <div className="app-root min-h-screen bg-background text-foreground flex flex-col">
      <main
        className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto text-center gap-6"
        data-testid="landing-page"
      >
        <h1 className="text-2xl font-bold tracking-tight">Skill Quest AI</h1>
        <p className="text-muted-foreground text-sm leading-relaxed">
          ポータルと学習ミニアプリは次のリリースで公開予定です。今はアカウントの作成・管理のみ利用できます。
        </p>
        {!isLoading && (
          <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
            {isAuthenticated ? (
              <Link
                to={PATH_ACCOUNT}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                アカウント設定
              </Link>
            ) : (
              <Link
                to={PATH_LOGIN}
                className="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                ログイン / 新規登録
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
