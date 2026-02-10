/**
 * クエスト一覧取得・追加・削除用カスタムフック（タスク 8.3, 8.5）
 * - useQuery でクエスト一覧を取得
 * - useMutation でクエスト追加・削除
 * - Hono RPC クライアントで型安全にフェッチ
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/lib/client';
import type { CreateQuestRequest } from '@skill-quest/shared';
import type { Task } from '@skill-quest/shared';

const QUESTS_QUERY_KEY = ['quests'] as const;

type QuestsClient = {
  api: {
    quests: {
      $get: () => Promise<Response>;
      $post: (opts: { json: CreateQuestRequest }) => Promise<Response>;
      ':id': {
        $delete: (opts: { param: { id: string } }) => Promise<Response>;
      };
    };
  };
};

async function fetchQuests(): Promise<Task[]> {
  const res = await (client as QuestsClient).api.quests.$get();
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Failed to fetch quests: ${res.status}`);
  }
  const list = (await res.json()) as Array<{
    id: string;
    title: string;
    type: string;
    difficulty: string;
    completed?: boolean;
    status?: 'todo' | 'in_progress' | 'done';
    completedAt?: number | string;
  }>;
  return list.map((q) => ({
    ...q,
    completed: q.completed ?? false,
    status: q.status || (q.completed ? 'done' : 'todo'),
    streak: 0,
  })) as Task[];
}

export function useQuests() {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: QUESTS_QUERY_KEY,
    queryFn: fetchQuests,
  });

  const addMutation = useMutation({
    mutationFn: async (input: CreateQuestRequest) => {
      const res = await (client as QuestsClient).api.quests.$post({ json: input });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `Failed to create quest: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUESTS_QUERY_KEY });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await (client as QuestsClient).api.quests[':id'].$delete({ param: { id } });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `Failed to delete quest: ${res.status}`);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUESTS_QUERY_KEY });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'todo' | 'in_progress' | 'done' }) => {
      // Hono RPCクライアントでネストされたパスパラメータルートにアクセスする場合、
      // 直接fetch APIを使用する方が確実
      const apiUrl = import.meta.env?.VITE_API_URL || 'http://localhost:8787';
      const res = await fetch(`${apiUrl}/api/quests/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || `Failed to update quest status: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUESTS_QUERY_KEY });
    },
  });

  return {
    ...query,
    addQuest: addMutation.mutate,
    deleteQuest: deleteMutation.mutate,
    updateQuestStatus: updateStatusMutation.mutate,
    invalidate: () => queryClient.invalidateQueries({ queryKey: QUESTS_QUERY_KEY }),
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isUpdatingStatus: updateStatusMutation.isPending,
  };
}
