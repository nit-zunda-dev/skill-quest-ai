/**
 * クエスト一覧取得用カスタムフック（タスク 8.3）
 * - useQuery でクエスト一覧を取得
 * - Hono RPC クライアントで型安全にフェッチ
 * - ローディング・エラー状態を返す
 */
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/client';

const QUESTS_QUERY_KEY = ['quests'] as const;

type QuestsClient = { api: { quests: { $get: () => Promise<Response> } } };

export function useQuests() {
  return useQuery({
    queryKey: QUESTS_QUERY_KEY,
    queryFn: async () => {
      const res = await (client as QuestsClient).api.quests.$get();
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `Failed to fetch quests: ${res.status}`);
      }
      return res.json();
    },
  });
}
