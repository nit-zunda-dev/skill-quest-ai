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

/** レアリティ別グロー色（CSS variable 用 rgba） */
const RARITY_GLOW: Record<string, string> = {
  legend: 'rgba(251, 191, 36, 0.7)',
  'ultra-rare': 'rgba(192, 132, 252, 0.6)',
  'super-rare': 'rgba(96, 165, 250, 0.55)',
  rare: 'rgba(52, 211, 153, 0.5)',
  common: 'rgba(148, 163, 184, 0.45)',
};

const defaultBorder = 'border-slate-500/50 bg-slate-700/20';
const defaultGlow = 'rgba(148, 163, 184, 0.4)';

export interface ItemAcquisitionCardProps {
  item: Item;
  /** コンパクト表示（モーダル用は false） */
  compact?: boolean;
  onClose?: () => void;
  /** 出現アニメーションの遅延（例: '0.15s'） */
  animationDelay?: string;
}

export function ItemAcquisitionCard({ item, compact = false, onClose, animationDelay }: ItemAcquisitionCardProps) {
  const [imageError, setImageError] = useState(false);
  const imagePath = buildItemImagePath(item.id, item.category);
  const borderClass = RARITY_BORDER[item.rarity] ?? defaultBorder;
  const glowColor = RARITY_GLOW[item.rarity] ?? defaultGlow;
  const style = { ['--item-glow-color' as string]: glowColor, ...(animationDelay ? { animationDelay } : {}) };

  if (compact) {
    return (
      <div
        className={`flex items-center gap-3 p-3 rounded-lg border ${borderClass} animate-item-pop-in`}
        style={style}
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
      className={`relative flex flex-col items-center p-5 rounded-2xl border-2 ${borderClass} animate-item-pop-in animate-item-glow-pulse overflow-hidden`}
      style={style}
      role="status"
      aria-label={`獲得: ${item.name}`}
    >
      {/* 光のスイープ */}
      <div
        className="absolute inset-0 pointer-events-none z-10 animate-item-shine-sweep"
        aria-hidden
        style={{
          background:
            'linear-gradient(105deg, transparent 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.35) 50%, rgba(255,255,255,0.15) 55%, transparent 100%)',
          width: '60%',
        }}
      />
      {/* 装飾パーティクル（レアリティに応じて数） */}
      {(() => {
        const count = ['legend', 'ultra-rare', 'super-rare'].includes(item.rarity) ? 5 : 3;
        const step = 360 / count;
        return Array.from({ length: count }, (_, i) => (
          <div
            key={i}
            className="absolute left-1/2 top-1/2 pointer-events-none"
            aria-hidden
            style={{
              transform: `translate(-50%, -50%) rotate(${i * step}deg) translateY(-32px)`,
            }}
          >
            <div
              className="w-1.5 h-1.5 rounded-full bg-white/80 animate-item-float"
              style={{ animationDelay: `${0.6 + i * 0.12}s`, animationDuration: '1.8s' }}
            />
          </div>
        ));
      })()}
      <div className="relative z-0 w-20 h-20 rounded-xl overflow-hidden bg-slate-700/50 shrink-0 mb-3 flex items-center justify-center animate-item-float">
        {imageError ? (
          <span className="text-3xl text-slate-500">?</span>
        ) : (
          <img
            src={imagePath}
            alt={item.name}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        )}
      </div>
      <p className="relative z-0 font-bold text-white text-center text-base truncate w-full drop-shadow-sm" title={item.name}>
        {item.name}
      </p>
      <p className="relative z-0 text-sm font-medium mt-1 text-slate-300">{RARITY_LABEL[item.rarity] ?? item.rarity}</p>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="relative z-0 mt-4 text-sm text-slate-400 hover:text-white underline transition-colors"
        >
          閉じる
        </button>
      )}
    </div>
  );
}
