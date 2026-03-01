/**
 * バーページ用: 所持アイテムからパートナー／ペットに渡すモーダル。
 * 記録のみで所持は消費しない。
 */
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getAcquiredItems } from '@/lib/api-client';
import { giveItemToPartnerOrPet } from '@/lib/api-client';
import { useInvalidatePartnerBar } from '@/hooks/usePartnerBar';
import { buildItemImagePath } from '@skill-quest/shared';
import type { AcquiredItemView } from '@skill-quest/shared';

const ACQUIRED_ITEMS_QUERY_KEY = ['acquired-items'] as const;

const RARITY_LABEL: Record<string, string> = {
  legend: 'レジェンド',
  'ultra-rare': 'ウルトラレア',
  'super-rare': 'スーパーレア',
  rare: 'レア',
  common: 'コモン',
};

export interface GiveItemModalProps {
  open: boolean;
  onClose: () => void;
  /** target が 'pet' のとき第2引数にレアリティ、'partner' のとき第3引数にアイテム名を渡す */
  onGiveSuccess?: (target: 'partner' | 'pet', grantedRarity?: string | null, itemName?: string) => void;
}

/** 所持一覧を itemId でユニーク化（先頭の1件を代表として表示） */
function uniqueByItemId(items: AcquiredItemView[]): AcquiredItemView[] {
  const seen = new Set<string>();
  return items.filter((a) => {
    if (seen.has(a.itemId)) return false;
    seen.add(a.itemId);
    return true;
  });
}

export function GiveItemModal({ open, onClose, onGiveSuccess }: GiveItemModalProps) {
  const [giving, setGiving] = useState<{ itemId: string; target: 'partner' | 'pet' } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const invalidate = useInvalidatePartnerBar();

  const { data: acquiredList = [], isLoading } = useQuery({
    queryKey: ACQUIRED_ITEMS_QUERY_KEY,
    queryFn: getAcquiredItems,
    enabled: open,
  });

  const uniqueItems = React.useMemo(() => uniqueByItemId(acquiredList), [acquiredList]);

  const handleGive = async (itemId: string, target: 'partner' | 'pet', itemName?: string) => {
    setError(null);
    setGiving({ itemId, target });
    try {
      const result = await giveItemToPartnerOrPet(itemId, target);
      invalidate();
      onGiveSuccess?.(target, target === 'pet' ? result.lastPetRarity : undefined, itemName);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : '渡せませんでした');
    } finally {
      setGiving(null);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div
        className="bg-slate-800 border border-cyan-500/30 rounded-xl max-w-md w-full max-h-[85vh] flex flex-col shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="give-item-title"
      >
        <div className="flex items-center justify-between p-4 border-b border-cyan-500/20">
          <h2 id="give-item-title" className="text-lg font-bold text-white">
            アイテムを渡す
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg"
            aria-label="閉じる"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          {isLoading && (
            <p className="text-slate-400 text-sm">読み込み中…</p>
          )}
          {!isLoading && uniqueItems.length === 0 && (
            <p className="text-slate-400 text-sm">所持アイテムがありません。クエストをクリアしてアイテムを獲得しましょう。</p>
          )}
          {!isLoading && uniqueItems.length > 0 && (
            <ul className="space-y-3">
              {uniqueItems.map((item) => (
                <li
                  key={item.itemId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-slate-900/80 border border-slate-700"
                >
                  <img
                    src={buildItemImagePath(item.itemId, item.category)}
                    alt=""
                    className="w-12 h-12 rounded object-contain bg-slate-800"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{item.name}</p>
                    <p className="text-xs text-slate-400">{RARITY_LABEL[item.rarity] ?? item.rarity}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleGive(item.itemId, 'partner', item.name)}
                      disabled={giving !== null}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/80 hover:bg-cyan-500 disabled:opacity-50 text-white text-sm font-medium"
                    >
                      {giving?.itemId === item.itemId && giving?.target === 'partner' ? '送信中…' : 'パートナーに'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleGive(item.itemId, 'pet')}
                      disabled={giving !== null}
                      className="px-3 py-1.5 rounded-lg bg-fuchsia-500/80 hover:bg-fuchsia-500 disabled:opacity-50 text-white text-sm font-medium"
                    >
                      {giving?.itemId === item.itemId && giving?.target === 'pet' ? '送信中…' : 'ペットに'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {error && (
            <p className="mt-3 text-red-400 text-sm" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
