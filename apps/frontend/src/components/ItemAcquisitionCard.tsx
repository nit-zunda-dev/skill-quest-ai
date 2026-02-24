/**
 * アイテム獲得演出用カード（EP-27）
 * クエスト完了時の獲得アイテム表示に利用。レアリティに応じた枠色と軽いアニメーション。
 */
import React, { useState } from 'react';
import { buildItemImagePath } from '@skill-quest/shared';
import type { Item } from '@skill-quest/shared';

/** レアリティの表示名 */
const RARITY_LABEL: Record<string, string> = {
  legend: 'レジェンド',
  'ultra-rare': 'ウルトラレア',
  'super-rare': 'スーパーレア',
  rare: 'レア',
  common: 'コモン',
};

/** レアリティ別の枠・アクセント色（Tailwind クラス） */
const RARITY_BORDER: Record<string, string> = {
  legend: 'border-amber-400/80 bg-amber-500/10',
  'ultra-rare': 'border-purple-400/70 bg-purple-500/10',
  'super-rare': 'border-blue-400/60 bg-blue-500/10',
  rare: 'border-emerald-400/50 bg-emerald-500/10',
  common: 'border-slate-400/40 bg-slate-500/10',
};

const defaultBorder = 'border-slate-500/50 bg-slate-700/20';

export interface ItemAcquisitionCardProps {
  item: Item;
  /** コンパクト表示（モーダル用は false） */
  compact?: boolean;
  onClose?: () => void;
}

export function ItemAcquisitionCard({ item, compact = false, onClose }: ItemAcquisitionCardProps) {
  const [imageError, setImageError] = useState(false);
  const imagePath = buildItemImagePath(item.id, item.category);
  const borderClass = RARITY_BORDER[item.rarity] ?? defaultBorder;

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border ${borderClass} animate-fade-in`}
        role="status"
        aria-label={`獲得: ${item.name}`}
      >
        {imageError ? (
          <div className="w-10 h-10 rounded bg-slate-700/50 flex items-center justify-center text-slate-500 shrink-0">
            ?
          </div>
        ) : (
          <img
            src={imagePath}
            alt={item.name}
            className="w-10 h-10 rounded object-cover bg-slate-700/50 shrink-0"
            onError={() => setImageError(true)}
          />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-white text-sm truncate" title={item.name}>
            {item.name}
          </p>
          <p className="text-xs text-slate-400">{RARITY_LABEL[item.rarity] ?? item.rarity}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center p-4 rounded-xl border ${borderClass} animate-fade-in`}
      role="status"
      aria-label={`獲得: ${item.name}`}
    >
      <div className="w-16 h-16 rounded-lg overflow-hidden bg-slate-700/50 shrink-0 mb-2 flex items-center justify-center">
        {imageError ? (
          <span className="text-2xl text-slate-500">?</span>
        ) : (
          <img
            src={imagePath}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      <p className="font-semibold text-white text-center text-sm truncate w-full" title={item.name}>
        {item.name}
      </p>
      <p className="text-xs text-slate-400 mt-0.5">{RARITY_LABEL[item.rarity] ?? item.rarity}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="mt-3 text-xs text-slate-400 hover:text-white underline"
        >
          閉じる
        </button>
      )}
    </div>
  );
}
