/**
 * グリモワールページ。一覧・生成・生成結果モーダルをこのページで完結。プロフィール更新は ProfileContext へ。
 */
import React, { useState, useEffect } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { CharacterProfile } from '@skill-quest/shared';
import Grimoire from '@/components/Grimoire';
import { useProfile } from '@/contexts/ProfileContext';
import { useGrimoire } from '@/hooks/useGrimoire';
import { normalizeProfileNumbers } from '@/lib/api-client';

export default function GrimoirePage() {
  const { profile, setProfile } = useProfile();
  const {
    data: grimoire = [],
    isLoading: grimoireLoading,
    generateGrimoire,
    isGenerating: isGeneratingGrimoire,
    generateResult: grimoireResult,
  } = useGrimoire();
  const [showGrimoireModal, setShowGrimoireModal] = useState(false);

  useEffect(() => {
    if (grimoireResult) {
      setShowGrimoireModal(true);
      if (grimoireResult.profile) {
        setProfile(normalizeProfileNumbers(grimoireResult.profile as unknown as CharacterProfile));
      }
    }
  }, [grimoireResult, setProfile]);

  return (
    <>
      <div className="flex-1 min-h-[400px]">
        {grimoireLoading ? (
          <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-6 h-full flex items-center justify-center text-slate-400 text-sm">
            グリモワールを読み込み中...
          </div>
        ) : (
          <Grimoire
            entries={grimoire}
            onGenerate={generateGrimoire}
            isGenerating={isGeneratingGrimoire}
          />
        )}
      </div>

      {showGrimoireModal && grimoireResult && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowGrimoireModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-indigo-500">
                <Sparkles className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-2xl font-display font-bold text-white mb-2">冒険の記録</h3>
              <p className="text-slate-300 italic mb-6 leading-relaxed bg-slate-900/50 p-4 rounded border border-slate-700/50">
                &quot;{grimoireResult.grimoireEntry.narrative}&quot;
              </p>
              <div className="flex justify-center space-x-6 mb-6 flex-wrap">
                <div className="text-center">
                  <div className="text-sm text-slate-500 uppercase">EXP</div>
                  <div className="text-2xl font-bold text-yellow-400">+{grimoireResult.grimoireEntry.rewardXp}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-slate-500 uppercase">GOLD</div>
                  <div className="text-2xl font-bold text-yellow-400">+{grimoireResult.grimoireEntry.rewardGold}</div>
                </div>
              </div>
              {grimoireResult.profile && grimoireResult.oldProfile && (
                <div className="mb-6 p-4 bg-slate-900/50 rounded border border-slate-700">
                  <div className="text-xs text-slate-500 uppercase mb-3 text-center">ステータス変化</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">経験値</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">
                          {Math.round(Number(grimoireResult.oldProfile.currentXp) || 0)}
                        </span>
                        <span className="text-slate-600">→</span>
                        <span className="text-yellow-400 font-bold">
                          {Math.round(Number(grimoireResult.profile.currentXp) || 0)}
                        </span>
                        <span className="text-yellow-400 text-sm">(+{grimoireResult.grimoireEntry.rewardXp})</span>
                      </div>
                    </div>
                    {Number(grimoireResult.profile.level) !== Number(grimoireResult.oldProfile.level) && (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">レベル</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500">
                            Lv.{Math.round(Number(grimoireResult.oldProfile.level) || 1)}
                          </span>
                          <span className="text-slate-600">→</span>
                          <span className="text-indigo-400 font-bold">
                            Lv.{Math.round(Number(grimoireResult.profile.level) || 1)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">ゴールド</span>
                      <div className="flex items-center gap-2">
                        <span className="text-slate-500">
                          {Math.round(Number(grimoireResult.oldProfile.gold) || 0)}
                        </span>
                        <span className="text-slate-600">→</span>
                        <span className="text-yellow-400 font-bold">
                          {Math.round(Number(grimoireResult.profile.gold) || 0)}
                        </span>
                        <span className="text-yellow-400 text-sm">(+{grimoireResult.grimoireEntry.rewardGold})</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowGrimoireModal(false)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-8 rounded-lg transition-colors"
              >
                閉じる
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
