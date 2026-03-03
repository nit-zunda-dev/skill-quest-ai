/**
 * 提案タスク一覧モーダル（Task 7.1 で開く、Task 7.2 で一覧・採用/却下）
 * 目標更新成功後に開き、提案を取得して一覧表示。採用時は一括登録し、閉じた後に Quest Board を更新する。
 */
import React, { useEffect } from 'react';
import { CharacterProfile } from '@skill-quest/shared';
import { X, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { useSuggestQuests } from '@/hooks/useSuggestQuests';

interface SuggestedQuestsModalProps {
  open: boolean;
  onClose: () => void;
  goal: string;
  profile: CharacterProfile;
}

const SuggestedQuestsModal: React.FC<SuggestedQuestsModalProps> = ({ open, onClose, goal, profile }) => {
  const {
    fetchSuggestions,
    adoptQuests,
    suggestions,
    isFetchingSuggestions,
    isAdopting,
    suggestError,
  } = useSuggestQuests();

  useEffect(() => {
    if (!open || !goal.trim()) return;
    fetchSuggestions({ goal: goal.trim() });
    // モーダルを開いたときのみ取得。fetchSuggestions は useMutation.mutate で安定
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleAdopt = () => {
    if (suggestions.length === 0) return;
    adoptQuests({ quests: suggestions }, { onSuccess: onClose });
  };

  const handleRetry = () => {
    fetchSuggestions({ goal: goal.trim() });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-card border border-border rounded-xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-500 hover:text-white"
          aria-label="閉じる"
        >
          <X className="w-6 h-6" />
        </button>
        <h3 className="text-xl font-bold text-card-foreground mb-4">タスク提案</h3>

        {isFetchingSuggestions && (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Loader2 className="w-10 h-10 animate-spin mb-4" />
            <p className="text-lg">提案を取得中...</p>
          </div>
        )}

        {suggestError && !isFetchingSuggestions && (
          <div className="rounded-xl bg-destructive/10 border border-destructive/60 p-4 text-center">
            <p className="text-red-300 mb-2">{suggestError.message}</p>
            <p className="text-muted-foreground text-sm mb-4">しばらく経ってから再試行してください。</p>
            <button
              type="button"
              onClick={handleRetry}
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-medium rounded-lg"
            >
              再試行
            </button>
          </div>
        )}

        {open && !goal.trim() && !isFetchingSuggestions && (
          <div className="rounded-xl bg-muted/40 border border-border p-4 text-center text-muted-foreground text-sm">
            目標が設定されていません。左の「目標」で目標を入力し、確定すると提案が表示されます。
          </div>
        )}

        {!isFetchingSuggestions && suggestions.length > 0 && !suggestError && goal.trim() && (
          <>
            <ul className="space-y-3 mb-6">
              {suggestions.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 bg-card/80 border border-border rounded-lg px-4 py-3 text-card-foreground"
                >
                  <span className="font-medium">{item.title}</span>
                  <span className="text-muted-foreground text-sm">{item.type}</span>
                  <span className="text-muted-foreground text-sm">{item.difficulty}</span>
                </li>
              ))}
            </ul>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={handleAdopt}
                disabled={isAdopting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-primary-foreground bg-primary rounded-xl hover:bg-primary/90 disabled:opacity-50"
              >
                {isAdopting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                採用
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={isAdopting}
                className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 font-bold text-muted-foreground bg-muted rounded-xl hover:bg-muted/80"
              >
                <XCircle className="w-5 h-5" />
                スキップ
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SuggestedQuestsModal;
