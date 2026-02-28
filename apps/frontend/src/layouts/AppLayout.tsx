/**
 * 認証済みアプリの共通レイアウト。サイドバーナビ・プロフィール・目標更新・ログアウト・アカウント削除。
 */
import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { X, LogOut, Trash2, Home, ListTodo, Scroll, MessageCircle, Package } from 'lucide-react';
import StatusPanel from '@/components/StatusPanel';
import GoalUpdateUI from '@/components/GoalUpdateUI';
import SuggestedQuestsModal from '@/components/SuggestedQuestsModal';
import { useProfile } from '@/contexts/ProfileContext';
import { useAuth } from '@/hooks/useAuth';
import { deleteAccount } from '@/lib/api-client';
import { PATH_APP, PATH_APP_QUESTS, PATH_APP_GRIMOIRE, PATH_APP_PARTNER, PATH_APP_ITEMS, PATH_LOGIN } from '@/lib/paths';

const CONFIRM_DELETE_TEXT = '削除する';

const navItems = [
  { to: PATH_APP, label: 'ホーム', icon: Home },
  { to: PATH_APP_QUESTS, label: 'クエストボード', icon: ListTodo },
  { to: PATH_APP_GRIMOIRE, label: 'グリモワール', icon: Scroll },
  { to: PATH_APP_PARTNER, label: 'バー', icon: MessageCircle },
  { to: PATH_APP_ITEMS, label: '獲得アイテム', icon: Package },
];

type AppLayoutProps = {
  children?: React.ReactNode;
};

export default function AppLayout({ children }: AppLayoutProps) {
  const { profile } = useProfile();
  const { signOut, session } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestModalGoal, setSuggestModalGoal] = useState('');

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

  const navContent = (
    <>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 md:border-0">
        <span className="font-bold text-white text-lg">Skill Quest</span>
      </div>
      <nav className="flex flex-col gap-1 p-2">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === PATH_APP}
            onClick={() => setSidebarOpen(false)}
            className={({ isActive }: { isActive: boolean }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600/80 text-white'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`
            }
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="flex-1 min-h-0 overflow-y-auto p-2 space-y-2">
        <StatusPanel profile={profile} />
        <GoalUpdateUI
          profile={profile}
          onGoalUpdateSuccess={(updatedGoal) => {
            setSuggestModalGoal(updatedGoal);
            setShowSuggestModal(true);
          }}
        />
        <button
          type="button"
          onClick={async () => {
            await signOut();
            navigate(PATH_LOGIN);
          }}
          className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-slate-600 hover:bg-slate-500 border border-slate-500 text-slate-100 rounded-lg text-sm transition-colors cursor-pointer"
          aria-label="ログアウト"
        >
          <LogOut className="w-4 h-4" />
          ログアウト
        </button>
        <button
          type="button"
          onClick={openDeleteAccountModal}
          className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-transparent hover:bg-red-950/30 border border-red-800/50 text-red-400 hover:text-red-300 rounded-lg text-sm transition-colors cursor-pointer"
          aria-label="アカウントを削除"
        >
          <Trash2 className="w-4 h-4" />
          アカウント削除
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col md:flex-row relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px]" />
      </div>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-700/50 z-20 bg-slate-900/90 backdrop-blur">
        <span className="font-bold text-white">Skill Quest</span>
        <button
          type="button"
          onClick={() => setSidebarOpen((o) => !o)}
          className="p-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600"
          aria-label="メニュー"
        >
          <ListTodo className="w-6 h-6" />
        </button>
      </div>

      {/* Sidebar: mobile overlay / desktop fixed */}
      <aside
        className={`
          fixed md:static inset-y-0 left-0 z-30 w-72 flex flex-col bg-slate-900/95 md:bg-transparent border-r border-slate-700/50
          transform transition-transform duration-200 ease-out md:transform-none
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}
      >
        <div className="md:hidden flex justify-end p-2">
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-lg"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">{navContent}</div>
      </aside>

      {/* Overlay when sidebar open on mobile */}
      {sidebarOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-label="閉じる"
        />
      )}

      {/* Main */}
      <main className="flex-1 min-h-0 flex flex-col p-4 md:p-8 z-10 overflow-auto">
        {children ?? <Outlet />}
      </main>

      <SuggestedQuestsModal
        open={showSuggestModal}
        onClose={() => setShowSuggestModal(false)}
        goal={suggestModalGoal}
        profile={profile}
      />

      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-800 border border-red-900/50 rounded-xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={closeDeleteAccountModal}
              disabled={isDeletingAccount}
              className="absolute top-4 right-4 text-slate-500 hover:text-white disabled:opacity-50"
              aria-label="閉じる"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2 mb-4 text-red-400">
              <Trash2 className="w-6 h-6 flex-shrink-0" />
              <h3 className="text-xl font-bold text-white">アカウントを削除</h3>
            </div>
            <p className="text-slate-300 text-sm mb-4">
              アカウントと紐づくすべてのデータ（プロフィール・クエスト・グリモワールなど）が完全に削除され、元に戻せません。本当に削除する場合は、下の欄に「
              <strong className="text-red-400">{CONFIRM_DELETE_TEXT}</strong>」と入力してください。
            </p>
            <input
              type="text"
              value={deleteAccountConfirmText}
              onChange={(e) => setDeleteAccountConfirmText(e.target.value)}
              placeholder={CONFIRM_DELETE_TEXT}
              disabled={isDeletingAccount}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-red-500 outline-none mb-4"
              aria-label="削除確認のため「削除する」と入力"
            />
            {deleteAccountError && (
              <p className="text-red-400 text-sm mb-4" role="alert">
                {deleteAccountError}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeDeleteAccountModal}
                disabled={isDeletingAccount}
                className="flex-1 py-2 px-4 bg-slate-600 hover:bg-slate-500 text-slate-100 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteAccountConfirmText !== CONFIRM_DELETE_TEXT || isDeletingAccount}
                className="flex-1 py-2 px-4 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeletingAccount ? '削除中...' : 'アカウントを削除する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
