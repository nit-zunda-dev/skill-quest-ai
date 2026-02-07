import type { Bindings } from '../types';

/**
 * Workers AI モデルID（design.md / docs/architecture/06_AI設計.md に準拠）
 */
export const MODEL_LLAMA_31_8B = '@cf/meta/llama-3.1-8b-instruct';
export const MODEL_LLAMA_33_70B = '@cf/meta/llama-3.3-70b-instruct-fp8-fast';

/** Workers AI run() の非ストリーミング応答（prompt 使用時） */
interface TextGenerationResponse {
  response?: string;
}

/** env.AI の run のみ利用するための最小インターフェース（Cloudflare Ai と互換） */
export interface AiRunBinding {
  run(
    model: string,
    options: { prompt: string; [key: string]: unknown }
  ): Promise<TextGenerationResponse>;
}

/**
 * Llama 3.1 8B でテキスト生成（通常の会話・生成用）
 * env.AI バインディングを使用する。
 */
export async function runWithLlama31_8b(ai: AiRunBinding, prompt: string): Promise<string> {
  const result = await ai.run(MODEL_LLAMA_31_8B, { prompt });
  return result?.response ?? '';
}

/**
 * Llama 3.3 70B でテキスト生成（複雑な推論用）
 * env.AI バインディングを使用する。
 */
export async function runWithLlama33_70b(ai: AiRunBinding, prompt: string): Promise<string> {
  const result = await ai.run(MODEL_LLAMA_33_70B, { prompt });
  return result?.response ?? '';
}

export interface AiService {
  runWithLlama31_8b(prompt: string): Promise<string>;
  runWithLlama33_70b(prompt: string): Promise<string>;
}

/**
 * env から AI バインディングを取得し、AI サービスを生成する。
 * env.AI は Cloudflare Workers の Ai バインディング（AiRunBinding と互換）。
 */
export function createAiService(env: Bindings): AiService {
  const ai = env.AI as AiRunBinding;
  return {
    runWithLlama31_8b(prompt: string) {
      return runWithLlama31_8b(ai, prompt);
    },
    runWithLlama33_70b(prompt: string) {
      return runWithLlama33_70b(ai, prompt);
    },
  };
}
