/**
 * Workers AIのスタブ関数
 * テストで使用するWorkers AIのモックを提供
 */
import type { Ai } from '@cloudflare/workers-types';

/**
 * Workers AIのモックを作成
 * @param overrides カスタマイズ可能なオプション
 * @returns AIバインディングのモック
 */
export function createMockAI(overrides?: {
  run?: () => AsyncGenerator<{ response: string }, void, unknown>;
  error?: Error;
}): Ai {
  if (overrides?.error) {
    return {
      run: async () => {
        throw overrides.error;
      },
    } as unknown as Ai;
  }

  if (overrides?.run) {
    return {
      run: overrides.run,
    } as unknown as Ai;
  }

  // デフォルトのモック: 空のストリームを返す
  async function* defaultStream() {
    yield { response: '' };
  }

  return {
    run: async () => defaultStream(),
  } as unknown as Ai;
}

/**
 * ストリーミングレスポンスを生成するヘルパー関数
 * @param chunks ストリームするチャンクの配列
 * @returns ストリーミングジェネレータ
 */
export function createStreamingResponse(chunks: string[]): AsyncGenerator<{ response: string }, void, unknown> {
  return (async function* () {
    for (const chunk of chunks) {
      yield { response: chunk };
    }
  })();
}
