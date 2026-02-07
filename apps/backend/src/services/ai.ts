import type { Bindings } from '../types';
import type { CharacterProfile, GenesisFormData } from '@skill-quest/shared';

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
  generateCharacter(data: GenesisFormData): Promise<CharacterProfile>;
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
    generateCharacter(data: GenesisFormData) {
      return generateCharacter(ai, data);
    },
  };
}

/** フォールバック用のデフォルトプロフィール */
function defaultCharacterProfile(name: string, goal: string): CharacterProfile {
  return {
    name,
    className: '冒険者',
    title: '見習い',
    stats: { strength: 50, intelligence: 50, charisma: 50, willpower: 50, luck: 50 },
    prologue: `目標: ${goal}`,
    startingSkill: '基礎',
    themeColor: '#4a90d9',
    level: 1,
    currentXp: 0,
    nextLevelXp: 100,
    hp: 100,
    maxHp: 100,
    gold: 0,
  };
}

function isCharacterProfile(obj: unknown): obj is CharacterProfile {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.name === 'string' &&
    typeof o.className === 'string' &&
    typeof o.title === 'string' &&
    o.stats != null &&
    typeof (o.stats as Record<string, unknown>).strength === 'number' &&
    typeof o.prologue === 'string' &&
    typeof o.startingSkill === 'string' &&
    typeof o.themeColor === 'string' &&
    typeof o.level === 'number' &&
    typeof o.currentXp === 'number' &&
    typeof o.nextLevelXp === 'number' &&
    typeof o.hp === 'number' &&
    typeof o.maxHp === 'number' &&
    typeof o.gold === 'number'
  );
}

function extractJson(text: string): unknown {
  const trimmed = text.trim();
  const jsonStart = trimmed.indexOf('{');
  if (jsonStart === -1) return null;
  let depth = 0;
  let end = -1;
  for (let i = jsonStart; i < trimmed.length; i++) {
    if (trimmed[i] === '{') depth++;
    if (trimmed[i] === '}') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;
  try {
    return JSON.parse(trimmed.slice(jsonStart, end + 1));
  } catch {
    return null;
  }
}

/**
 * Llama 3.1 8B でキャラクタープロフィールを生成する。
 * プロンプトを構築し、JSON をパースして返す。失敗時はフォールバックプロフィールを返す。
 */
export async function generateCharacter(
  ai: AiRunBinding,
  data: GenesisFormData
): Promise<CharacterProfile> {
  const prompt = buildCharacterPrompt(data);
  try {
    const raw = await runWithLlama31_8b(ai, prompt);
    let parsed: unknown = typeof raw === 'string' ? extractJson(raw) : null;
    if (parsed === null && typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }
    if (isCharacterProfile(parsed)) {
      return parsed;
    }
  } catch {
    // fall through to fallback
  }
  return defaultCharacterProfile(data.name, data.goal);
}

function buildCharacterPrompt(data: GenesisFormData): string {
  return [
    `以下の条件でゲームのキャラクターを1体生成し、JSONのみで返してください。`,
    `名前: ${data.name}`,
    `目標: ${data.goal}`,
    `ジャンル: ${data.genre}`,
    `必須フィールド: name, className, title, stats(strength,intelligence,charisma,willpower,luck), prologue, startingSkill, themeColor(#で始まる6桁色), level, currentXp, nextLevelXp, hp, maxHp, gold.`,
    `statsの各値は0以上100以下、合計250にすること。nameは「${data.name}」にすること。`,
  ].join('\n');
}
