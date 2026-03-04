/**
 * タスクボードページ。QuestBoard とナラティブ完了モーダル・提案モーダルをこのページで完結。
 */
import React, { useState, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Task } from '@skill-quest/shared';
import type { Item } from '@skill-quest/shared';
import { X, Sparkles } from 'lucide-react';
import QuestBoard from '@/components/QuestBoard';
import { ItemAcquisitionCard } from '@/components/ItemAcquisitionCard';
import SuggestedQuestsModal from '@/components/SuggestedQuestsModal';
import { useProfile } from '@/contexts/ProfileContext';
import { useQuests } from '@/hooks/useQuests';
import { useGrimoire } from '@/hooks/useGrimoire';
import { generateTaskNarrative, normalizeProfileNumbers } from '@/lib/api-client';
import type { NarrativeResult } from '@/lib/api-client';

export default function QuestBoardPage() {
  const { profile, setProfile } = useProfile();
  const queryClient = useQueryClient();
  const {
    data: serverTasks = [],
    isLoading: questsLoading,
    isError: questsError,
    addQuest,
    deleteQuest,
    updateQuestStatusAsync,
    invalidate: invalidateQuests,
  } = useQuests();
  const { invalidate: invalidateGrimoire } = useGrimoire();
  const [completedTask, setCompletedTask] = useState<Task | null>(null);
  const [narrativeComment, setNarrativeComment] = useState('');
  const [isProcessingNarrative, setIsProcessingNarrative] = useState(false);
  const [narrativeResult, setNarrativeResult] = useState<NarrativeResult | null>(null);
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  /** 直接完了（status → done）で獲得したアイテム。表示用モーダル用 */
  const [directCompleteGrantedItem, setDirectCompleteGrantedItem] = useState<Item | null>(null);

  const tasks: Task[] = useMemo(
    () =>
      serverTasks.map((t) => ({
        ...t,
        completed: t.completed ?? false,
        status: (t.status || (t.completed ? 'done' : 'todo')) as 'todo' | 'in_progress' | 'done',
        streak: t.streak ?? 0,
      })),
    [serverTasks]
  );

  const addTask = (taskData: Omit<Task, 'id' | 'completed' | 'streak'>) => {
    addQuest({ title: taskData.title, type: taskData.type, difficulty: taskData.difficulty });
  };

  const initiateCompleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
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
      const result = await generateTaskNarrative(completedTask, narrativeComment, profile);
      setNarrativeResult(result);
      if (result.profile) {
        setProfile(normalizeProfileNumbers(result.profile));
      }
      invalidateQuests();
      invalidateGrimoire();
      queryClient.invalidateQueries({ queryKey: ['acquired-items'] });
    } catch (e) {
      console.error('Failed to generate narrative', e);
    } finally {
      setIsProcessingNarrative(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, status: 'todo' | 'in_progress' | 'done') => {
    try {
      const data = await updateQuestStatusAsync({ id: taskId, status });
      console.log('[QuestBoard] status update response:', { taskId, status, grantedItem: data.grantedItem });
      if (status === 'done' && data.grantedItem != null) {
        setDirectCompleteGrantedItem(data.grantedItem);
      }
    } catch (e) {
      console.error('[QuestBoard] status update failed:', e);
    }
  };

  const closeNarrativeModal = () => {
    setCompletedTask(null);
    setNarrativeResult(null);
  };

  return (
    <>
      <div className="flex-1 min-h-[400px]">
        {questsLoading ? (
          <div className="bg-card/70 backdrop-blur-md border border-border rounded-xl p-6 h-full flex items-center justify-center text-muted-foreground">
            クエストを読み込み中...
          </div>
        ) : questsError ? (
          <div className="bg-card/70 backdrop-blur-md border border-border rounded-xl p-6 h-full flex items-center justify-center text-destructive">
            クエストの読み込みに失敗しました
          </div>
        ) : (
          <QuestBoard
            tasks={tasks}
            onAddTask={addTask}
            onCompleteTask={initiateCompleteTask}
            onDeleteTask={(id) => deleteQuest(id)}
            onUpdateStatus={handleUpdateStatus}
            onRequestSuggestFromGoal={() => {
              setShowSuggestModal(true);
            }}
            worldviewId={profile.worldviewId}
          />
        )}
      </div>

      {completedTask && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button onClick={closeNarrativeModal} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X className="w-6 h-6" />
            </button>
            {!narrativeResult ? (
              <>
                <h3 className="text-xl font-bold text-foreground mb-2">クエスト報告: {completedTask.title}</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  このタスクについてのコメントや感想があれば入力してください。AIがあなたの物語を紡ぎます。
                </p>
                <textarea
                  className="w-full bg-input border border-border rounded-lg p-3 text-foreground focus:ring-2 focus:ring-ring outline-none mb-6 h-24 resize-none"
                  placeholder="例：30分集中できた！ / 雨の中走りきった！"
                  value={narrativeComment}
                  onChange={(e) => setNarrativeComment(e.target.value)}
                />
                <button
                  onClick={confirmCompletion}
                  disabled={isProcessingNarrative}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3 rounded-lg flex items-center justify-center transition-all"
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
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/50">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-2xl font-display font-bold text-foreground mb-2">QUEST CLEAR!</h3>
                <p className="text-muted-foreground italic mb-6 leading-relaxed p-4 rounded border border-border/70" style={{ backgroundColor: 'var(--surface-soft)' }}>
                  &quot;{narrativeResult.narrative}&quot;
                </p>
                <div className="flex justify-center space-x-6 mb-6 flex-wrap">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground uppercase">EXP</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--reward-fg)' }}>+{narrativeResult.xp}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground uppercase">GOLD</div>
                    <div className="text-2xl font-bold" style={{ color: 'var(--reward-fg)' }}>+{narrativeResult.gold}</div>
                  </div>
                </div>
                {narrativeResult.grantedItem != null && (
                  <div className="mb-6">
                    <p className="text-center text-lg font-bold text-transparent bg-clip-text bg-linear-to-r from-primary via-accent to-primary mb-4 animate-item-get-text">
                      アイテムをゲット！
                    </p>
                    <div className="flex justify-center">
                      <ItemAcquisitionCard item={narrativeResult.grantedItem} animationDelay="0.15s" />
                    </div>
                  </div>
                )}
                <button
                  onClick={closeNarrativeModal}
                  className="bg-secondary hover:bg-secondary/80 text-secondary-foreground font-bold py-2 px-8 rounded-lg"
                >
                  閉じる
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {directCompleteGrantedItem != null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-card/95 border border-border rounded-2xl max-w-sm w-full p-6 shadow-2xl animate-item-pop-in">
            <p className="text-center text-xl font-bold text-transparent bg-clip-text bg-linear-to-r from-primary via-accent to-primary mb-5 animate-item-get-text">
              アイテムをゲット！
            </p>
            <ItemAcquisitionCard item={directCompleteGrantedItem} onClose={() => setDirectCompleteGrantedItem(null)} />
          </div>
        </div>
      )}

      <SuggestedQuestsModal
        open={showSuggestModal}
        onClose={() => setShowSuggestModal(false)}
        goal={profile.goal ?? ''}
        profile={profile}
      />
    </>
  );
}