/**
 * TanStack Query のセットアップ（タスク 8.2）
 * クエリクライアントの設定（キャッシュ、リフェッチ設定など）
 */
import { QueryClient } from '@tanstack/react-query';

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1分間は fresh
        refetchOnWindowFocus: true,
        retry: 1,
      },
    },
  });
}
