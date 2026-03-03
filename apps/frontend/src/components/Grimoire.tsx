import React from 'react';
import { GrimoireEntry } from '@skill-quest/shared';
import { Scroll, Sparkles, Wand2 } from 'lucide-react';
import { useGrimoire } from '@/hooks/useGrimoire';
import { useAiUsage } from '@/hooks/useAiUsage';
import { useProfile } from '@/contexts/ProfileContext';

interface GrimoireProps {
  entries: GrimoireEntry[];
  onGenerate?: () => void;
  isGenerating?: boolean;
}

const Grimoire: React.FC<GrimoireProps> = ({ entries, onGenerate, isGenerating: externalIsGenerating }) => {
  const { generateGrimoire: internalGenerateGrimoire, isGenerating: internalIsGenerating, generateError } = useGrimoire();
  const { canGenerateGrimoire, grimoireRemaining, isLoading: usageLoading } = useAiUsage();
  const { profile } = useProfile();

  const isGenerating = externalIsGenerating ?? internalIsGenerating;
  const generateGrimoire = onGenerate ?? internalGenerateGrimoire;

  const worldviewId = profile.worldviewId;
  const titleLabel =
    worldviewId === 'arcane-terminal'
      ? 'グリモワール (セッションログ)'
      : worldviewId === 'chronicle-campus'
        ? 'グリモワール (学習記録)'
        : worldviewId === 'neo-frontier-hub'
          ? 'グリモワール (ミッションログ)'
          : 'グリモワール (冒険の記録)';

  const emptyText =
    worldviewId === 'arcane-terminal'
      ? 'まだセッションはログに記録されていません'
      : worldviewId === 'chronicle-campus'
        ? 'まだ今月の学習記録は書き込まれていません'
        : worldviewId === 'neo-frontier-hub'
          ? 'まだミッションログは開かれていません'
          : 'まだ物語は始まっていません';

  const handleGenerate = () => {
    if (canGenerateGrimoire && !isGenerating) {
      generateGrimoire();
    }
  };

  return (
    <div className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-6 h-full flex flex-col shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white flex items-center">
          <Scroll className="w-5 h-5 mr-2 text-indigo-400" />
          {titleLabel}
        </h2>
        <button
          onClick={handleGenerate}
          disabled={!canGenerateGrimoire || isGenerating || usageLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            canGenerateGrimoire && !isGenerating && !usageLoading
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
          }`}
          title={
            !canGenerateGrimoire
              ? 'グリモワール生成は1日1回までです'
              : '完了したタスクすべてを参考にグリモワールを生成'
          }
        >
          <Wand2 className="w-4 h-4" />
          {isGenerating ? '生成中...' : 'グリモワール作成'}
          {grimoireRemaining > 0 && (
            <span className="text-xs opacity-75">({grimoireRemaining}回残り)</span>
          )}
        </button>
      </div>

      {generateError && (
        <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
          エラー: {generateError instanceof Error ? generateError.message : 'グリモワール生成に失敗しました'}
        </div>
      )}

      <div className="grow overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {entries.length === 0 ? (
          <div className="text-center text-slate-500 py-10 italic">
            {emptyText}
          </div>
        ) : (
          entries.slice().reverse().map(entry => (
            <div key={entry.id} className="bg-slate-900/60 p-4 rounded-lg border border-slate-700/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs text-slate-500 font-mono">{entry.date}</span>
                <span className="text-xs text-indigo-300 border border-indigo-900 bg-indigo-900/20 px-2 py-0.5 rounded">
                  {entry.taskTitle}
                </span>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed mb-3">
                {entry.narrative}
              </p>
              <div className="flex items-center text-xs space-x-3 text-yellow-500/80 font-medium">
                 <span className="flex items-center"><Sparkles className="w-3 h-3 mr-1" /> +{entry.rewardXp} XP</span>
                 <span className="flex items-center">+{entry.rewardGold} G</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Grimoire;
