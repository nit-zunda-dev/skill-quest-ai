/**
 * 提案取得と採用時の一括登録を行うフック（タスク 5.2）
 * - 提案取得: suggestQuests を呼び出し、ローディング・エラー状態を扱う
 * - 採用: createQuestsBatch を呼び出し、成功時にクエスト一覧を invalidate
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { suggestQuests, createQuestsBatch } from '@/lib/api-client';
import type { CreateQuestBatchRequest, SuggestQuestsRequest } from '@skill-quest/shared';

const QUESTS_QUERY_KEY = ['quests'] as const;

export function useSuggestQuests() {
  const queryClient = useQueryClient();

  const suggestMutation = useMutation({
    mutationFn: (req: SuggestQuestsRequest) => suggestQuests(req),
  });

  const adoptMutation = useMutation({
    mutationFn: (req: CreateQuestBatchRequest) => createQuestsBatch(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUESTS_QUERY_KEY });
    },
  });

  return {
    fetchSuggestions: suggestMutation.mutate,
    adoptQuests: adoptMutation.mutate,
    suggestions: suggestMutation.data ?? [],
    isFetchingSuggestions: suggestMutation.isPending,
    isAdopting: adoptMutation.isPending,
    suggestError: suggestMutation.error instanceof Error ? suggestMutation.error : undefined,
    adoptError: adoptMutation.error instanceof Error ? adoptMutation.error : undefined,
  };
}
