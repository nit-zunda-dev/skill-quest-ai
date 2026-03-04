import React from 'react';
import { Gift, Sparkles } from 'lucide-react';
import { PetAvatar } from '@/components/PetAvatar';
import { GiveItemModal } from '@/components/GiveItemModal';
import { useLastPetRarity, useInvalidatePartnerBar } from '@/hooks/usePartnerBar';

const FAVORABILITY_MAX = 1000;

export default function PetPage() {
  const { data: lastPetRarity } = useLastPetRarity();
  const invalidate = useInvalidatePartnerBar();
  const [giveModalOpen, setGiveModalOpen] = React.useState(false);
  const [itemJustGivenUntil, setItemJustGivenUntil] = React.useState(0);
  const [lastGrantedRarity, setLastGrantedRarity] = React.useState<string | null>(null);

  const now = Date.now();
  const isItemJustGiven = itemJustGivenUntil > now;

  const handleGiveSuccess = React.useCallback(
    (_target: 'partner' | 'pet', grantedRarity?: string | null) => {
      if (grantedRarity !== undefined) {
        setLastGrantedRarity(grantedRarity);
      }
      setItemJustGivenUntil(Date.now() + 30000);
      invalidate();
    },
    [invalidate]
  );

  const effectiveRarity = lastGrantedRarity ?? lastPetRarity ?? null;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-foreground mb-2">ペット</h1>
        <p className="text-muted-foreground text-sm">
          クエストで集めたアイテムをペットに渡して、少しずつ仲良くなっていきましょう。
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr),minmax(0,3fr)]">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border p-6 relative overflow-hidden" style={{ backgroundColor: 'var(--surface-strong)' }}>
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-24 left-0 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: 'var(--ui-glow-2)' }} />
            <div className="absolute bottom-0 right-0 w-72 h-72 rounded-full blur-3xl" style={{ backgroundColor: 'var(--ui-glow-1)' }} />
          </div>
          <div className="relative flex flex-col items-center gap-3">
            {isItemJustGiven && (
              <div className="px-3 py-2 rounded-lg border text-center animate-fade-in-up" style={{ borderColor: 'var(--partner-secondary)', backgroundColor: 'var(--interactive-soft)', boxShadow: '0 0 18px var(--partner-accent-soft)' }}>
                <p className="text-sm font-medium flex items-center justify-center gap-1" style={{ color: 'var(--partner-secondary)' }}>
                  <Sparkles className="w-4 h-4" />
                  アイテムを受け取って嬉しそうにしている。
                </p>
              </div>
            )}
            <PetAvatar
              lastGrantedRarity={effectiveRarity}
              className="w-40 sm:w-48 md:w-56 lg:w-64 max-h-[40vh] object-contain object-bottom drop-shadow-[0_12px_32px_rgba(0,0,0,0.6)]"
              alt="ペット"
            />
            <p className="text-xs text-muted-foreground">
              最後に渡したアイテムのレアリティ:{' '}
              <span className="font-medium text-foreground">{effectiveRarity ?? 'まだ何も渡していません'}</span>
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border p-4" style={{ backgroundColor: 'var(--surface-strong)' }}>
            <h2 className="text-sm font-semibold text-foreground mb-2">ペットとの関係</h2>
            <p className="text-sm text-muted-foreground">
              ペットは、あなたがクエストで集めたアイテムからエネルギーをもらっています。レアリティが高いほど、少し特別な反応を見せるかもしれません。
            </p>
          </div>

          <div className="rounded-2xl border border-border p-4 space-y-3" style={{ backgroundColor: 'var(--surface-strong)' }}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">アイテムを渡す</h2>
                <p className="text-xs text-muted-foreground">
                  所持しているアイテムの中から、ペットに贈るものを選びます。所持アイテムは消費されず、記録のみ行われます。
                </p>
              </div>
              <button
                type="button"
                onClick={() => setGiveModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-white text-xs font-medium border transition-colors"
                style={{ backgroundColor: 'var(--partner-secondary)', borderColor: 'var(--partner-secondary)', boxShadow: '0 0 14px var(--partner-accent-soft)' }}
              >
                <Gift className="w-4 h-4" />
                ペットにアイテムを渡す
              </button>
            </div>

            <div className="rounded-xl border border-border p-3 text-xs text-muted-foreground space-y-1.5" style={{ backgroundColor: 'var(--interactive-soft)' }}>
              <p className="font-semibold text-foreground">ヒント</p>
              <ul className="list-disc list-inside space-y-1">
                <li>レアリティが高いアイテムほど、ペットの反応が少し変わります。</li>
                <li>ペットとの関係は今後のアップデートで、より多くの要素に影響する予定です。</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <GiveItemModal
        open={giveModalOpen}
        onClose={() => setGiveModalOpen(false)}
        onGiveSuccess={handleGiveSuccess}
        allowedTargets={['pet']}
      />
    </div>
  );
}

