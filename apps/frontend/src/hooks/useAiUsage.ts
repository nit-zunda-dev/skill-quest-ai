/**
 * AI利用状況取得用カスタムフック
 * - useQuery でAI利用残り回数を取得
 */
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/client';

const AI_USAGE_QUERY_KEY = ['ai-usage'] as const;

type AiUsageClient = {
  api: {
    ai: {
      usage: {
        $get: () => Promise<Response>;
      };
    };
  };
};

interface AiUsageResponse {
  characterGenerated: boolean;
  narrativeRemaining: number;
  partnerRemaining: number;
  chatRemaining: number;
  grimoireRemaining: number;
  limits: {
    narrative: number;
    partner: number;
    chat: number;
    grimoire: number;
  };
}

async function fetchAiUsage(): Promise<AiUsageResponse> {
  const res = await (client as AiUsageClient).api.ai.usage.$get();
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Failed to fetch AI usage: ${res.status}`);
  }
  return (await res.json()) as AiUsageResponse;
}

export function useAiUsage(options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: AI_USAGE_QUERY_KEY,
    queryFn: fetchAiUsage,
    enabled: options?.enabled,
    // refetchInterval を削除: 自動的な定期再取得を停止
  });

  return {
    ...query,
    grimoireRemaining: query.data?.grimoireRemaining ?? 0,
    canGenerateGrimoire: (query.data?.grimoireRemaining ?? 0) > 0,
  };
}
