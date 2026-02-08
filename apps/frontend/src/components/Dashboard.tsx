import React, { useState, useMemo } from 'react';
import { Task, GrimoireEntry, CharacterProfile } from '@skill-quest/shared';
import StatusPanel from './StatusPanel';
import QuestBoard from './QuestBoard';
import Grimoire from './Grimoire';
import PartnerWidget from './PartnerWidget';
import { generateTaskNarrative, normalizeProfileNumbers, deleteAccount } from '@/lib/api-client';
import { X, Sparkles, LogOut, Trash2 } from 'lucide-react';
import { useQuests } from '@/hooks/useQuests';
import { useAuth } from '@/hooks/useAuth';

interface DashboardProps {
  initialProfile: CharacterProfile;
}

const Dashboard: React.FC<DashboardProps> = ({ initialProfile }) => {
  const { signOut, session } = useAuth();
  const [profile, setProfile] = useState<CharacterProfile>(() => normalizeProfileNumbers(initialProfile));
  const { data: serverTasks = [], isLoading: questsLoading, isError: questsError, addQuest, deleteQuest } = useQuests();
  const [grimoire, setGrimoire] = useState<GrimoireEntry[]>([]);
  /** 完了・ストリークはAPIにないためローカルで保持（quest id -> { completed, streak }） */
  const [localCompletion, setLocalCompletion] = useState<Record<string, { completed: boolean; streak: number }>>({});

  const tasks: Task[] = useMemo(() => {
    return serverTasks.map((t) => ({
      ...t,
      completed: localCompletion[t.id]?.completed ?? t.completed ?? false,
      streak: localCompletion[t.id]?.streak ?? t.streak ?? 0,
    }));
  }, [serverTasks, localCompletion]);

  // Narrative Modal State
  const [completedTask, setCompletedTask] = useState<Task | null>(null);
  const [narrativeComment, setNarrativeComment] = useState('');
  const [isProcessingNarrative, setIsProcessingNarrative] = useState(false);
  const [narrativeResult, setNarrativeResult] = useState<{narrative: string, xp: number, gold: number} | null>(null);

  /** アカウント削除確認モーダル */
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [deleteAccountConfirmText, setDeleteAccountConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);

  const addTask = (taskData: Omit<Task, 'id' | 'completed' | 'streak'>) => {
    addQuest({ title: taskData.title, type: taskData.type, difficulty: taskData.difficulty });
  };

  const deleteTask = (taskId: string) => {
    deleteQuest(taskId);
  };

  const initiateCompleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      setCompletedTask(task);
      setNarrativeComment('');
      setNarrativeResult(null);
    }
  };

  const confirmCompletion = async () => {
    if (!completedTask) return;
    
    setIsProcessingNarrative(true);
    try {
      // 1. Generate Narrative
      const result = await generateTaskNarrative(completedTask, narrativeComment, profile);
      setNarrativeResult(result);

      // 2. Update Profile (XP, Level, Gold)
      setProfile(prev => {
        let newXp = prev.currentXp + result.xp;
        let newLevel = prev.level;
        let nextXp = prev.nextLevelXp;
        let newGold = prev.gold + result.gold;

        // Level Up Logic
        if (newXp >= nextXp) {
          newXp -= nextXp;
          newLevel += 1;
          nextXp = Math.floor(nextXp * 1.2); // Simple exponential curve
          // Maybe restore HP on level up
        }

        return {
          ...prev,
          level: newLevel,
          currentXp: newXp,
          nextLevelXp: nextXp,
          gold: newGold
        };
      });

      // 3. Update local completion (APIに完了状態がないためローカルで保持)
      setLocalCompletion(prev => ({
        ...prev,
        [completedTask.id]: { completed: true, streak: (prev[completedTask.id]?.streak ?? completedTask.streak ?? 0) + 1 },
      }));

      // 4. Add to Grimoire
      const newEntry: GrimoireEntry = {
        id: Date.now().toString(),
        date: new Date().toLocaleDateString('ja-JP'),
        taskTitle: completedTask.title,
        narrative: result.narrative,
        rewardXp: result.xp,
        rewardGold: result.gold
      };
      setGrimoire(prev => [...prev, newEntry]);

    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessingNarrative(false);
    }
  };

  const closeNarrativeModal = () => {
    setCompletedTask(null);
    setNarrativeResult(null);
  };

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

  const CONFIRM_DELETE_TEXT = '削除する';
  const handleDeleteAccount = async () => {
    if (deleteAccountConfirmText !== CONFIRM_DELETE_TEXT || !session?.user?.id) return;
    setIsDeletingAccount(true);
    setDeleteAccountError(null);
    try {
      await deleteAccount(session.user.id);
      await signOut();
      closeDeleteAccountModal();
    } catch (e) {
      setDeleteAccountError(e instanceof Error ? e.message : 'アカウント削除に失敗しました');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-8 flex flex-col md:flex-row gap-6 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[100px]"></div>
         <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-purple-900/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Left: Status (Fixed on Desktop, Top on Mobile) */}
      <div className="w-full md:w-80 flex-shrink-0 z-10 flex flex-col gap-4">
        <StatusPanel profile={profile} />
        <button
          type="button"
          onClick={() => signOut()}
          className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-slate-600 hover:bg-slate-500 border border-slate-500 text-slate-100 rounded-lg text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          aria-label="ログアウト"
        >
          <LogOut className="w-4 h-4" />
          ログアウト
        </button>
        <button
          type="button"
          onClick={openDeleteAccountModal}
          className="flex items-center justify-center gap-2 w-full py-2 px-4 bg-transparent hover:bg-red-950/30 border border-red-800/50 text-red-400 hover:text-red-300 rounded-lg text-sm transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-slate-900"
          aria-label="アカウントを削除"
        >
          <Trash2 className="w-4 h-4" />
          アカウント削除
        </button>
      </div>

      {/* Center: Main Content */}
      <div className="flex-grow flex flex-col gap-6 z-10 min-h-0">
        <div className="flex-1 min-h-[400px]">
          {questsLoading ? (
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6 h-full flex items-center justify-center text-slate-400">
              クエストを読み込み中...
            </div>
          ) : questsError ? (
            <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6 h-full flex items-center justify-center text-red-400">
              クエストの読み込みに失敗しました
            </div>
          ) : (
            <QuestBoard 
              tasks={tasks} 
              onAddTask={addTask} 
              onCompleteTask={initiateCompleteTask}
              onDeleteTask={deleteTask}
            />
          )}
        </div>
        <div className="h-64 md:h-80">
           <Grimoire entries={grimoire} />
        </div>
      </div>

      {/* Floating Partner Widget */}
      <PartnerWidget />

      {/* Narrative Completion Modal */}
      {completedTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={closeNarrativeModal} className="absolute top-4 right-4 text-slate-500 hover:text-white">
              <X className="w-6 h-6" />
            </button>
            
            {!narrativeResult ? (
              <>
                <h3 className="text-xl font-bold text-white mb-2">クエスト報告: {completedTask.title}</h3>
                <p className="text-slate-400 text-sm mb-4">このタスクについてのコメントや感想があれば入力してください。AIがあなたの物語を紡ぎます。</p>
                <textarea
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none mb-6 h-24 resize-none"
                  placeholder="例：30分集中できた！ / 雨の中走りきった！"
                  value={narrativeComment}
                  onChange={(e) => setNarrativeComment(e.target.value)}
                />
                <button
                  onClick={confirmCompletion}
                  disabled={isProcessingNarrative}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-lg flex items-center justify-center transition-all"
                >
                  {isProcessingNarrative ? (
                    <span className="animate-pulse">記録中...</span>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5 mr-2" /> 完了して報酬を受け取る
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="text-center animate-fade-in-up">
                <div className="w-16 h-16 bg-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-yellow-500">
                  <Sparkles className="w-8 h-8 text-yellow-400" />
                </div>
                <h3 className="text-2xl font-display font-bold text-white mb-2">QUEST CLEAR!</h3>
                <p className="text-slate-300 italic mb-6 leading-relaxed bg-slate-900/50 p-4 rounded border border-slate-700/50">
                  "{narrativeResult.narrative}"
                </p>
                <div className="flex justify-center space-x-8 mb-8">
                  <div className="text-center">
                    <div className="text-sm text-slate-500 uppercase">EXP</div>
                    <div className="text-2xl font-bold text-yellow-400">+{narrativeResult.xp}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-slate-500 uppercase">GOLD</div>
                    <div className="text-2xl font-bold text-yellow-400">+{narrativeResult.gold}</div>
                  </div>
                </div>
                <button
                  onClick={closeNarrativeModal}
                  className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-8 rounded-lg"
                >
                  閉じる
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* アカウント削除確認モーダル */}
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
              アカウントと紐づくすべてのデータ（プロフィール・クエスト・グリモワールなど）が完全に削除され、元に戻せません。本当に削除する場合は、下の欄に「<strong className="text-red-400">{CONFIRM_DELETE_TEXT}</strong>」と入力してください。
            </p>
            <input
              type="text"
              value={deleteAccountConfirmText}
              onChange={(e) => setDeleteAccountConfirmText(e.target.value)}
              placeholder={CONFIRM_DELETE_TEXT}
              disabled={isDeletingAccount}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none mb-4"
              aria-label="削除確認のため「削除する」と入力"
            />
            {deleteAccountError && (
              <p className="text-red-400 text-sm mb-4" role="alert">{deleteAccountError}</p>
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
};

export default Dashboard;
