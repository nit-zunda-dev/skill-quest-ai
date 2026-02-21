/**
 * 未定義パス用の 404 画面（Task 6.1, Requirements 5.1）
 * ページタイトルを「見つかりません」と分かる文言に設定し、
 * ランディング・ログインへのリンクを提供する。
 */
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PATH_LANDING, PATH_LOGIN } from '@/lib/paths';

const PAGE_TITLE = 'ページが見つかりません | Skill Quest AI';

export default function NotFoundPage() {
  useEffect(() => {
    document.title = PAGE_TITLE;
  }, []);

  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center px-4" data-testid="not-found-page">
      <h1 className="text-6xl font-bold text-slate-300 mb-2">404</h1>
      <p className="text-xl text-slate-400 mb-8">ページが見つかりません</p>
      <nav className="flex flex-wrap gap-4 justify-center">
        <Link
          to={PATH_LANDING}
          className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors"
        >
          トップへ
        </Link>
        <Link
          to={PATH_LOGIN}
          className="px-4 py-2 rounded-lg border border-slate-600 text-slate-300 hover:border-indigo-500 hover:text-indigo-400 transition-colors"
        >
          ログイン
        </Link>
      </nav>
    </main>
  );
}
