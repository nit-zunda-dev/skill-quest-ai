import React, { useEffect, useState } from 'react';
import { CharacterProfile } from '@skill-quest/shared';
import { Compass, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useSuggestQuests } from '@/hooks/useSuggestQuests';

interface SuggestStepProps {
  profile: CharacterProfile;
  onComplete: () => void;
}

/**
 * Genesis 直後の提案ステップ（Task 6.1, 6.2）。
 * 保存済み goal で提案取得・一覧表示。goal が無い場合は簡易入力フォーム。
 * 採用時は一括登録してダッシュボードへ、却下時はそのままダッシュボードへ。
 */
const SuggestStep: React.FC<SuggestStepProps> = ({ profile, onComplete }) => {
  const {
    fetchSuggestions,
    adoptQuests,
    suggestions,
    isFetchingSuggestions,
    isAdopting,
    suggestError,
  } = useSuggestQuests();

  const [goalInput, setGoalInput] = useState('');

  const hasGoal = (profile.goal?.trim() ?? '').length > 0;

  useEffect(() => {
    if (!hasGoal || !profile.goal?.trim()) return;
    if (suggestions.length > 0 || isFetchingSuggestions || suggestError) return;
    fetchSuggestions({ goal: profile.goal.trim(), genre: profile.genre });
    // 初回マウント時のみ実行。fetchSuggestions を依存に含めると無限ループの可能性があるため除外
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasGoal, profile.goal, profile.genre]);

  const handleSubmitGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const goal = goalInput.trim();
    if (goal.length > 0) {
      fetchSuggestions({ goal, genre: profile.genre });
    }
  };

  const handleAdopt = () => {
    if (suggestions.length === 0) return;
    adoptQuests({ quests: suggestions }, { onSuccess: onComplete });
  };

  const handleReject = () => {
    onComplete();
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-fade-in pb-12" data-testid="genesis-suggest-step">
      <div className="text-center mb-10">
        <span className="text-indigo-400 text-sm font-semibold tracking-wider uppercase">タスク提案</span>
        <h1 className="text-3xl md:text-4xl font-display font-bold text-white mt-2 mb-2">
          目標に沿ったクエストを提案します
        </h1>
        <p className="text-lg text-slate-400">
          次のステップで提案を確認し、採用またはスキップできます。
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        {!hasGoal && suggestions.length === 0 && !isFetchingSuggestions && !suggestError && (
          <form onSubmit={handleSubmitGoal} className="space-y-4">
            <label className="block text-sm font-medium text-slate-400">目標を入力してください</label>
            <input
              type="text"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="例：英語学習、ダイエット、副業など"
              className="w-full bg-slate-800/50 border border-slate-700 text-slate-100 rounded-lg px-4 py-3 focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              type="submit"
              disabled={goalInput.trim().length === 0}
              className="w-full inline-flex items-center justify-center px-6 py-3 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              提案を取得
            </button>
          </form>
        )}

        {isFetchingSuggestions && (
          <div className="flex flex-col items-center justify-center py-8 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-lg">生成中...</p>
          </div>
        )}

        {suggestError && (
          <div className="rounded-xl bg-red-900/20 border border-red-700/50 p-6 text-center">
            <p className="text-red-300 mb-2">{suggestError.message}</p>
            <p className="text-slate-400 text-sm">しばらく経ってから再試行してください。</p>
          </div>
        )}

        {!isFetchingSuggestions && suggestions.length > 0 && !suggestError && (
          <>
            <ul className="space-y-3">
              {suggestions.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-3 text-slate-200"
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="text-slate-500 text-sm">{item.type}</span>
                  <span className="text-slate-500 text-sm">{item.difficulty}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleAdopt}
                disabled={isAdopting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-white bg-indigo-600 rounded-xl hover:bg-indigo-500 disabled:opacity-50"
              >
                {isAdopting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                採用
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={isAdopting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-slate-200 bg-slate-700 rounded-xl hover:bg-slate-600"
              >
                <XCircle className="w-5 h-5" />
                スキップ
              </button>
            </div>
          </>
        )}

        {!hasGoal && suggestions.length === 0 && !isFetchingSuggestions && !suggestError && (
          <button
            type="button"
            onClick={onComplete}
            className="w-full mt-4 text-slate-400 hover:text-slate-300 text-sm"
          >
            スキップしてダッシュボードへ
          </button>
        )}
      </div>
    </div>
  );
};

export default SuggestStep;
