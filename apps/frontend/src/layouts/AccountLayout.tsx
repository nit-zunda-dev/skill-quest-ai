import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { LogOut, Trash2, ArrowLeft, X } from 'lucide-react';
import { PageMeta } from '@/components/PageMeta';
import { useAuth } from '@/hooks/useAuth';
import { deleteAccount } from '@/lib/api-client';
import { PATH_ACCOUNT, PATH_LANDING, PATH_LOGIN } from '@/lib/paths';
import { getRouteMeta } from '@/lib/route-meta';

const CONFIRM_DELETE_TEXT = '削除する';

export function AccountLayout() {
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  const openDeleteAccountModal = () => {
    setShowDeleteAccountModal(true);
    setDeleteAccountConfirmText('');
    setDeleteAccountError(null);
  };

  const closeDeleteAccountModal = () => {
    if (isDeletingAccount) return;
    setShowDeleteAccountModal(false);
    setDeleteAccountConfirmText('');
    setDeleteAccountError(null);
  };

  const handleDeleteAccount = async () => {
    if (deleteAccountConfirmText !== CONFIRM_DELETE_TEXT || !session?.user?.id) return;
    setIsDeletingAccount(true);
    setDeleteAccountError(null);
    try {
      await deleteAccount(session.user.id);
      await signOut();
      closeDeleteAccountModal();
      navigate(PATH_LOGIN);
    } catch (e) {
      setDeleteAccountError(e instanceof Error ? e.message : 'アカウント削除に失敗しました');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <PageMeta {...getRouteMeta(PATH_ACCOUNT)}>
      <div className="app-root min-h-screen bg-background text-foreground">
        <header className="border-b border-border px-4 py-3 flex items-center gap-4">
          <Link
            to={PATH_LANDING}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            トップへ
          </Link>
          <span className="font-semibold text-foreground">アカウント</span>
        </header>
        <div className="max-w-md mx-auto p-4">
          <Outlet />
        </div>
        <div className="max-w-md mx-auto px-4 pb-8 flex flex-col gap-2">
          <button
            type="button"
            onClick={async () => {
              await signOut();
              navigate(PATH_LOGIN);
            }}
            className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-secondary hover:bg-secondary/80 border border-border rounded-lg text-sm"
          >
            <LogOut className="w-4 h-4" />
            ログアウト
          </button>
          <button
            type="button"
            onClick={openDeleteAccountModal}
            className="flex items-center justify-center gap-2 w-full py-2 px-4 border border-destructive/50 text-destructive hover:bg-destructive/10 rounded-lg text-sm"
          >
            <Trash2 className="w-4 h-4" />
            アカウントを削除
          </button>
        </div>

        {showDeleteAccountModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
          >
            <div className="bg-card border border-border rounded-xl shadow-lg max-w-md w-full p-6 relative">
              <button
                type="button"
                onClick={closeDeleteAccountModal}
                className="absolute top-3 right-3 p-1 rounded-md text-muted-foreground hover:bg-secondary"
                aria-label="閉じる"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 id="delete-account-title" className="text-lg font-semibold text-foreground pr-8">
                アカウントを削除しますか？
              </h2>
              <p className="text-sm text-muted-foreground mt-2">
                この操作は取り消せません。確認のため「{CONFIRM_DELETE_TEXT}」と入力してください。
              </p>
              <input
                type="text"
                value={deleteAccountConfirmText}
                onChange={(e) => setDeleteAccountConfirmText(e.target.value)}
                className="mt-4 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                placeholder={CONFIRM_DELETE_TEXT}
                disabled={isDeletingAccount}
              />
              {deleteAccountError && (
                <p className="text-sm text-destructive mt-2">{deleteAccountError}</p>
              )}
              <div className="mt-4 flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={closeDeleteAccountModal}
                  disabled={isDeletingAccount}
                  className="px-4 py-2 rounded-lg border border-border text-sm"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={
                    isDeletingAccount || deleteAccountConfirmText !== CONFIRM_DELETE_TEXT
                  }
                  className="px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm disabled:opacity-50"
                >
                  {isDeletingAccount ? '削除中…' : '削除する'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageMeta>
  );
}
