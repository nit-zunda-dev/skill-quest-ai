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
          <div className="bg-card/70 backdrop-blur-md border border-border rounded-xl p-6 h-full flex items-center justify-center text-muted-foreground text-sm">
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
          <div className="bg-card border border-border rounded-xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowGrimoireModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="text-center animate-fade-in-up">
              <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-primary/50">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground mb-1">冒険の記録</h3>
              <p className="text-primary font-medium mb-4 text-lg">
                「{grimoireResult.grimoireEntry.taskTitle}」
              </p>
              <p className="text-muted-foreground italic mb-6 leading-relaxed p-4 rounded border border-border/70" style={{ backgroundColor: 'var(--surface-soft)' }}>
                &quot;{grimoireResult.grimoireEntry.narrative}&quot;
              </p>
              <div className="flex justify-center space-x-6 mb-6 flex-wrap">
                <div className="text-center">
                  <div className="text-sm text-muted-foreground uppercase">EXP</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--reward-fg)' }}>+{grimoireResult.grimoireEntry.rewardXp}</div>
                </div>
                <div className="text-center">
                  <div className="text-sm text-muted-foreground uppercase">GOLD</div>
                  <div className="text-2xl font-bold" style={{ color: 'var(--reward-fg)' }}>+{grimoireResult.grimoireEntry.rewardGold}</div>
                </div>
              </div>
              {grimoireResult.profile && grimoireResult.oldProfile && (
                <div className="mb-6 p-4 rounded border border-border" style={{ backgroundColor: 'var(--surface-soft)' }}>
                  <div className="text-xs text-muted-foreground uppercase mb-3 text-center">ステータス変化</div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">経験値</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {Math.round(Number(grimoireResult.oldProfile.currentXp) || 0)}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-bold" style={{ color: 'var(--reward-fg)' }}>
                          {Math.round(Number(grimoireResult.profile.currentXp) || 0)}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--reward-fg)' }}>(+{grimoireResult.grimoireEntry.rewardXp})</span>
                      </div>
                    </div>
                    {Number(grimoireResult.profile.level) !== Number(grimoireResult.oldProfile.level) && (
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">レベル</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">
                            Lv.{Math.round(Number(grimoireResult.oldProfile.level) || 1)}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="text-primary font-bold">
                            Lv.{Math.round(Number(grimoireResult.profile.level) || 1)}
                          </span>
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">ゴールド</span>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">
                          {Math.round(Number(grimoireResult.oldProfile.gold) || 0)}
                        </span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-bold" style={{ color: 'var(--reward-fg)' }}>
                          {Math.round(Number(grimoireResult.profile.gold) || 0)}
                        </span>
                        <span className="text-sm" style={{ color: 'var(--reward-fg)' }}>(+{grimoireResult.grimoireEntry.rewardGold})</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowGrimoireModal(false)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-2 px-8 rounded-lg transition-colors"
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
