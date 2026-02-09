/**
 * グリモワール一覧取得用カスタムフック
 * - useQuery でグリモワール一覧を取得
 * - API経由で永続化されたデータを表示
 * - useMutation でグリモワール生成機能を提供
 */
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { client } from '@/lib/client';
import type { GrimoireEntry } from '@skill-quest/shared';

const GRIMOIRE_QUERY_KEY = ['grimoire'] as const;

type GrimoireClient = {
  api: {
    grimoire: {
      $get: () => Promise<Response>;
      generate: {
        $post: () => Promise<Response>;
      };
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

async function generateGrimoire(): Promise<GrimoireEntry> {
  const res = await (client as GrimoireClient).api.grimoire.generate.$post();
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: `Failed to generate grimoire: ${res.status}` }));
    throw new Error(err.message || `Failed to generate grimoire: ${res.status}`);
  }
  const data = (await res.json()) as { grimoireEntry: GrimoireEntry };
  return data.grimoireEntry;
}

export function useGrimoire() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: GRIMOIRE_QUERY_KEY,
    queryFn: fetchGrimoire,
  });

  const generateMutation = useMutation({
    mutationFn: generateGrimoire,
    onSuccess: () => {
      // 生成後にグリモワール一覧を再取得
      queryClient.invalidateQueries({ queryKey: GRIMOIRE_QUERY_KEY });
    },
  });

  return {
    ...query,
    invalidate: () => queryClient.invalidateQueries({ queryKey: GRIMOIRE_QUERY_KEY }),
    generateGrimoire: generateMutation.mutate,
    isGenerating: generateMutation.isPending,
    generateError: generateMutation.error,
  };
}
