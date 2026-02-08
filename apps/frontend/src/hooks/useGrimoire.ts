/**
 * グリモワール一覧取得用カスタムフック
 * - useQuery でグリモワール一覧を取得
 * - API経由で永続化されたデータを表示
 */
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/client';
import type { GrimoireEntry } from '@skill-quest/shared';

const GRIMOIRE_QUERY_KEY = ['grimoire'] as const;

type GrimoireClient = {
  api: {
    grimoire: {
      $get: () => Promise<Response>;
    };
  };
};

async function fetchGrimoire(): Promise<GrimoireEntry[]> {
  const res = await (client as GrimoireClient).api.grimoire.$get();
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Failed to fetch grimoire: ${res.status}`);
  }
  const list = (await res.json()) as GrimoireEntry[];
  return list;
}

export function useGrimoire() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: GRIMOIRE_QUERY_KEY,
    queryFn: fetchGrimoire,
  });

  return {
    ...query,
    invalidate: () => queryClient.invalidateQueries({ queryKey: GRIMOIRE_QUERY_KEY }),
  };
}
