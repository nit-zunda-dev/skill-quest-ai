/**
 * 獲得アイテム一覧（プレースホルダー）。EP-26 ガチャ実装後にリスト表示を差し替える。
 */
import React from 'react';
import { Package } from 'lucide-react';

export default function ItemsPage() {
  return (
    <div className="max-w-xl mx-auto flex flex-col items-center justify-center min-h-[50vh] text-center">
      <div className="w-20 h-20 rounded-2xl bg-slate-700/50 flex items-center justify-center mb-6">
        <Package className="w-10 h-10 text-slate-500" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">獲得アイテム</h2>
      <p className="text-slate-400 text-sm">
        タスクをクリアすると獲得したアイテムがここに表示されます。
        <br />
        準備中です。お楽しみに。
      </p>
    </div>
  );
}
