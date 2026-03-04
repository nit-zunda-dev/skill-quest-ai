/**
 * 未定義パス用の 404 画面（Task 6.1, 13.1, Requirements 5.1, 3.1）
 * ページタイトルを「見つかりません」と分かる文言に設定し、
 * ランディング・ログインへのリンクを提供する。ルート別メタは NOT_FOUND_META で適用。
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { PATH_LANDING, PATH_LOGIN } from '@/lib/paths';
import { PageMeta } from '@/components/PageMeta';
import { NOT_FOUND_META } from '@/lib/route-meta';

export default function NotFoundPage() {
  return (
    <PageMeta {...NOT_FOUND_META}>
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4" data-testid="not-found-page">
      <h1 className="text-6xl font-bold text-foreground mb-2">404</h1>
      <p className="text-xl text-muted-foreground mb-8">ページが見つかりません</p>
      <nav className="flex flex-wrap gap-4 justify-center">
        <Link
          to={PATH_LANDING}
          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          トップへ
        </Link>
        <Link
          to={PATH_LOGIN}
          className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:border-primary hover:text-primary transition-colors"
        >
          ログイン
        </Link>
      </nav>
    </main>
    </PageMeta>
  );
}
