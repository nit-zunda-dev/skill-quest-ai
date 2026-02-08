/**
 * AI利用残り回数取得用カスタムフック（タスク 9.3）
 * - GET /api/ai/usage で残り回数・制限情報を取得
 * - 制限到達時にボタン無効化やメッセージ表示に利用
 */
import { useQuery } from '@tanstack/react-query';
import { client } from '@/lib/client';

export type AiUsage = {
  characterGenerated: boolean;
  narrativeRemaining: number;
  partnerRemaining: number;
  chatRemaining: number;
  limits: { narrative: number; partner: number; chat: number };
};

const AI_USAGE_QUERY_KEY = ['ai', 'usage'] as const;
const USAGE_FETCH_TIMEOUT_MS = 12_000;

type AiUsageClient = {
  api: {
    ai: {
      usage: {
        $get: (opts?: { signal?: AbortSignal }) => Promise<Response>;
      };
    };
  };
};

async function fetchAiUsage(): Promise<AiUsage> {
  const res = await (client as AiUsageClient).api.ai.usage.$get();
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `Failed to fetch AI usage: ${res.status}`);
  }
  return res.json();
}

function delay(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Request timeout')), ms)
  );
}

/** タイムアウト付きで GET /api/ai/usage を呼ぶ（認証後ハング対策） */
async function fetchAiUsageWithTimeout(): Promise<AiUsage> {
  return Promise.race([
    fetchAiUsage(),
    delay(USAGE_FETCH_TIMEOUT_MS),
  ]);
}

export function useAiUsage(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: AI_USAGE_QUERY_KEY,
    queryFn: fetchAiUsageWithTimeout,
    enabled: options?.enabled !== false,
    retry: false,
  });
}
