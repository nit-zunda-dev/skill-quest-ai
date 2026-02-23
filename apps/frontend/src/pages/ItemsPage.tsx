/**
 * 獲得アイテム一覧（Task 6.1）
 * 全アイテムをレアリティごとに表示。所持済みは名前・画像、未所持は ? で表示して収集意欲を促す。
 */
import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Package } from 'lucide-react';
import { getAcquiredItems, getItemMaster } from '@/lib/api-client';
import { buildItemImagePath, RARITY_ORDER } from '@skill-quest/shared';
import type { AcquiredItemView, Item } from '@skill-quest/shared';

const ITEMS_QUERY_KEY = ['acquired-items'] as const;
const ITEM_MASTER_QUERY_KEY = ['item-master'] as const;

/** レアリティの表示名 */
const RARITY_LABEL: Record<string, string> = {
  legend: 'レジェンド',
  'ultra-rare': 'ウルトラレア',
  'super-rare': 'スーパーレア',
  rare: 'レア',
  common: 'コモン',
};

/** マスタをレアリティごとにグループ化（表示順: レジェンド → コモン） */
function groupMasterByRarity(masterList: Item[]): Map<string, Item[]> {
  const orderByRarity = [...RARITY_ORDER].reverse();
  const map = new Map<string, Item[]>();
  for (const r of orderByRarity) {
    const group = masterList.filter((item) => item.rarity === r);
    if (group.length > 0) map.set(r, group);
  }
  return map;
}

export default function ItemsPage() {
  const { data: acquiredList = [], isLoading: loadingAcquired, error: errorAcquired } = useQuery({
    queryKey: ITEMS_QUERY_KEY,
    queryFn: getAcquiredItems,
  });
  const { data: masterList = [], isLoading: loadingMaster, error: errorMaster } = useQuery({
    queryKey: ITEM_MASTER_QUERY_KEY,
    queryFn: getItemMaster,
  });

  const collectedIds = useMemo(() => new Set(acquiredList.map((a) => a.itemId)), [acquiredList]);
  const groupedMaster = useMemo(() => groupMasterByRarity(masterList), [masterList]);

  const isLoading = loadingAcquired || loadingMaster;
  const error = errorAcquired ?? errorMaster;

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

  const totalCount = masterList.length;
  const collectedCount = collectedIds.size;

  return (
    <div className="max-w-5xl mx-auto flex flex-col min-h-[50vh]">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">獲得アイテム</h2>
        {totalCount > 0 && (
          <p className="text-sm text-slate-400">
            {collectedCount} / {totalCount} コレクト
          </p>
        )}
      </div>
      {masterList.length === 0 ? (
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
        <div className="space-y-5">
          {Array.from(groupedMaster.entries()).map(([rarity, groupItems]) => (
            <section key={rarity}>
              <h3 className="text-sm font-semibold text-slate-400 mb-2">
                {RARITY_LABEL[rarity] ?? rarity}
              </h3>
              <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {groupItems.map((item) =>
                  collectedIds.has(item.id) ? (
                    <ItemCard key={item.id} item={item} />
                  ) : (
                    <PlaceholderCard key={item.id} />
                  )
                )}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemCard({ item }: { item: Item }) {
  const imagePath = buildItemImagePath(item.id, item.category);
  return (
    <li className="flex flex-col items-center p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
      <img
        src={imagePath}
        alt={item.name}
        className="w-12 h-12 rounded object-cover bg-slate-700/50 shrink-0"
      />
      <p className="mt-2 font-medium text-white text-center text-sm truncate w-full" title={item.name}>
        {item.name}
      </p>
      <p className="text-xs text-slate-400">{item.rarity}</p>
    </li>
  );
}

function PlaceholderCard() {
  return (
    <li className="flex flex-col items-center p-3 rounded-lg bg-slate-800/30 border border-slate-700/50 border-dashed">
      <div className="w-12 h-12 rounded bg-slate-700/50 flex items-center justify-center text-xl font-bold text-slate-500 shrink-0">
        ?
      </div>
      <p className="mt-2 font-medium text-slate-500 text-sm">？？？</p>
      <p className="text-xs text-slate-600">未獲得</p>
    </li>
  );
}
