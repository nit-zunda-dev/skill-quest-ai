/**
 * ダッシュボード上の目標表示・編集・確定 UI（Task 7.1）
 * 確定時に目標更新 API を呼び、429 時は案内表示、成功時は onGoalUpdateSuccess で提案モーダルを開く。
 */
import React, { useState, useEffect } from 'react';
import { CharacterProfile } from '@skill-quest/shared';
import { updateGoal } from '@/lib/api-client';
import { Target } from 'lucide-react';

interface GoalUpdateUIProps {
  profile: CharacterProfile;
  /** 目標更新成功時に呼ぶ。更新後の目標を渡す（提案モーダルで使用）。 */
  onGoalUpdateSuccess: (updatedGoal: string) => void;
}

const GOAL_MIN = 1;
const GOAL_MAX = 500;

const GoalUpdateUI: React.FC<GoalUpdateUIProps> = ({ profile, onGoalUpdateSuccess }) => {
  const [editingGoal, setEditingGoal] = useState(profile.goal ?? '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setEditingGoal(profile.goal ?? '');
  }, [profile.goal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const goal = editingGoal.trim();
    if (goal.length < GOAL_MIN || goal.length > GOAL_MAX) {
      setErrorMessage('目標は1〜500文字で入力してください。');
      return;
    }
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await updateGoal({ goal });
      onGoalUpdateSuccess(goal);
    } catch (err) {
      const message = err instanceof Error ? err.message : '目標の更新に失敗しました。';
      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-4 shadow-xl" data-testid="goal-update-ui">
      <div className="flex items-center gap-2 mb-2">
        <Target className="w-4 h-4 text-indigo-400" aria-hidden />
        <h3 className="text-sm font-semibold text-slate-200">目標</h3>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <textarea
          data-testid="goal-input"
          value={editingGoal}
          onChange={(e) => setEditingGoal(e.target.value)}
          placeholder="例：英語力を上げる"
          rows={2}
          disabled={isSubmitting}
          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-sm disabled:opacity-50"
          aria-label="目標"
        />
        {errorMessage && (
          <p className="text-amber-400 text-sm" role="alert">
            {errorMessage}
          </p>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-2 px-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isSubmitting ? '更新中...' : '目標を更新'}
        </button>
      </form>
    </div>
  );
};

export default GoalUpdateUI;
