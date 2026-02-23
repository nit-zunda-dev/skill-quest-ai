/**
 * 獲得アイテム一覧（Task 6.1）
 * 所持一覧 API を呼び出し、取得時刻の降順で一覧表示する。画像はパス規則でクライアント組み立て。
 */
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { getAcquiredItems } from '@/lib/api-client';
import { buildItemImagePath } from '@skill-quest/shared';
import type { AcquiredItemView } from '@skill-quest/shared';

const ITEMS_QUERY_KEY = ['acquired-items'] as const;

export default function ItemsPage() {
  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ITEMS_QUERY_KEY,
    queryFn: getAcquiredItems,
  });

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-20 h-20 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-6 animate-pulse">
          <Package className="w-10 h-10 text-slate-500" />
        </div>
        <p className="text-slate-400 text-sm">読み込み中…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
        <p className="text-red-400 text-sm">{error instanceof Error ? error.message : '所持一覧の取得に失敗しました。'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto flex flex-col min-h-[50vh]">
      <h2 className="text-xl font-bold text-white mb-4">獲得アイテム</h2>
      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center flex-1 text-center">
          <div className="w-20 h-20 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-6">
            <Package className="w-10 h-10 text-slate-500" />
          </div>
          <p className="text-slate-400 text-sm">
            タスクをクリアすると獲得したアイテムがここに表示されます。
            <br />
            まだアイテムはありません。
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item: AcquiredItemView, index: number) => (
            <ItemRow key={`${item.itemId}-${item.acquiredAt}-${index}`} item={item} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ItemRow({ item }: { item: AcquiredItemView }) {
  const imagePath = buildItemImagePath(item.itemId, item.category);
  return (
    <li className="flex items-center gap-3 p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
      <img
        src={imagePath}
        alt={item.name}
        className="w-12 h-12 rounded object-cover bg-slate-700/50"
      />
      <div className="min-w-0">
        <p className="font-medium text-white truncate">{item.name}</p>
        <p className="text-xs text-slate-400">
          {item.category} / {item.rarity}
        </p>
      </div>
    </li>
  );
}
