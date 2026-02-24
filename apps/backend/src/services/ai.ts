import type { Bindings } from '../types';
import type { CharacterProfile, GenesisFormData } from '@skill-quest/shared';
import type { NarrativeRequest, PartnerMessageRequest, SuggestedQuestItem } from '@skill-quest/shared';
import { Difficulty, TaskType } from '@skill-quest/shared';
import { suggestedQuestItemSchema } from '@skill-quest/shared';
import grimoireTemplates from '../templates/grimoire.json';

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
    options: { prompt: string; [key: string]: unknown },
    gatewayOptions?: { gateway: { id: string } }
  ): Promise<TextGenerationResponse>;
  run(
    model: string,
    options: { messages: unknown[]; stream?: boolean; [key: string]: unknown },
    gatewayOptions?: { gateway: { id: string } }
  ): Promise<AsyncIterable<unknown>>;
}

/**
 * Llama 3.1 8B でテキスト生成（通常の会話・生成用）
 * env.AI バインディングを使用する。
 * AI Gatewayが設定されている場合は経由して呼び出す。
 */
export async function runWithLlama31_8b(
  ai: AiRunBinding,
  prompt: string,
  gatewayId?: string
): Promise<string> {
  const options = { prompt };
  const gatewayOptions = gatewayId ? { gateway: { id: gatewayId } } : undefined;
  const result = await ai.run(MODEL_LLAMA_31_8B, options, gatewayOptions);
  return result?.response ?? '';
}

/**
 * Llama 3.3 70B でテキスト生成（複雑な推論用）
 * env.AI バインディングを使用する。
 * AI Gatewayが設定されている場合は経由して呼び出す。
 */
export async function runWithLlama33_70b(
  ai: AiRunBinding,
  prompt: string,
  gatewayId?: string
): Promise<string> {
  const options = { prompt };
  const gatewayOptions = gatewayId ? { gateway: { id: gatewayId } } : undefined;
  const result = await ai.run(MODEL_LLAMA_33_70B, options, gatewayOptions);
  return result?.response ?? '';
}

/** ナラティブ生成の戻り値（物語セグメントと報酬） */
export interface NarrativeResult {
  narrative: string;
  rewardXp: number;
  rewardGold: number;
}

export interface CompletedTask {
  id: string;
  title: string;
  type: string;
  difficulty: string;
  completedAt: number;
}

export interface GrimoireContext {
  characterName: string;
  className: string;
  title: string;
  level: number;
  goal: string;
  previousNarratives: string[];
}

/** AIが返すグリモワールの章タイトルと報酬のみ（narrative はテンプレートで組み立てる） */
export interface GrimoireTitleAndRewards {
  title: string;
  rewardXp: number;
  rewardGold: number;
}

export interface AiService {
  runWithLlama31_8b(prompt: string): Promise<string>;
  runWithLlama33_70b(prompt: string): Promise<string>;
  generateCharacter(data: GenesisFormData): Promise<CharacterProfile>;
  generateNarrative(request: NarrativeRequest): Promise<NarrativeResult>;
  generatePartnerMessage(request: PartnerMessageRequest): Promise<string>;
  generateGrimoire(completedTasks: CompletedTask[], context?: GrimoireContext): Promise<GrimoireTitleAndRewards>;
  generateSuggestedQuests(goal: string): Promise<SuggestedQuestItem[]>;
}

/**
 * 統合テスト用スタブ: env.AI を呼ばず固定値を返す AiService
 */
function createStubAiService(env: Bindings): AiService {
  return {
    runWithLlama31_8b: async () => '',
    runWithLlama33_70b: async () => '',
    generateCharacter: async (data: GenesisFormData) =>
      defaultCharacterProfile(data.name, data.goal),
    generateNarrative: async () => ({
      narrative: 'Stub narrative.',
      rewardXp: 10,
      rewardGold: 5,
    }),
    generatePartnerMessage: async () => 'Stub partner message.',
    generateGrimoire: async () => ({
      title: 'Stub chapter',
      rewardXp: 10,
      rewardGold: 5,
    }),
    generateSuggestedQuests: async () => [
      { title: 'スタブ提案タスク', type: TaskType.DAILY, difficulty: Difficulty.MEDIUM },
    ],
  };
}

/**
 * env から AI バインディングを取得し、AI サービスを生成する。
 * env.AI は Cloudflare Workers の Ai バインディング（AiRunBinding と互換）。
 * AI Gateway IDが設定されている場合は、すべてのAI呼び出しをAI Gateway経由で実行する。
 * INTEGRATION_TEST_AI_STUB が '1' のときはスタブを返し本番AIを呼ばない。
 */
export function createAiService(env: Bindings): AiService {
  if (env.INTEGRATION_TEST_AI_STUB === '1') {
    return createStubAiService(env);
  }
  const ai = env.AI as AiRunBinding;
  const gatewayId = env.AI_GATEWAY_ID;
  return {
    runWithLlama31_8b(prompt: string) {
      return runWithLlama31_8b(ai, prompt, gatewayId);
    },
    runWithLlama33_70b(prompt: string) {
      return runWithLlama33_70b(ai, prompt, gatewayId);
    },
    generateCharacter(data: GenesisFormData) {
      return generateCharacter(ai, data, gatewayId);
    },
    generateNarrative(request: NarrativeRequest) {
      return generateNarrative(ai, request, gatewayId);
    },
    generatePartnerMessage(request: PartnerMessageRequest) {
      return generatePartnerMessage(ai, request, gatewayId);
    },
    generateGrimoire(completedTasks: CompletedTask[], context?: GrimoireContext) {
      return generateGrimoire(ai, completedTasks, gatewayId, context);
    },
    generateSuggestedQuests(goal: string) {
      return generateSuggestedQuests(ai, goal, gatewayId);
    },
  };
}

/** フォールバック用のデフォルトプロフィール */
function defaultCharacterProfile(name: string, goal: string): CharacterProfile {
  return {
    name,
    className: '冒険者',
    title: '見習い',
    prologue: `目標: ${goal}`,
    themeColor: '#4a90d9',
    level: 1,
    currentXp: 0,
    nextLevelXp: 100,
    gold: 0,
    goal,
  };
}

function isCharacterProfile(obj: unknown): obj is CharacterProfile {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  const hasRequiredFields = (
    typeof o.name === 'string' &&
    typeof o.className === 'string' &&
    typeof o.title === 'string' &&
    typeof o.prologue === 'string' &&
    typeof o.themeColor === 'string' &&
    typeof o.level === 'number' &&
    typeof o.currentXp === 'number' &&
    typeof o.nextLevelXp === 'number' &&
    typeof o.gold === 'number'
  );
  return hasRequiredFields;
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

/** テキストから JSON 配列を抽出する（AI 応答の配列用） */
function extractJsonArray(text: string): unknown[] | null {
  const trimmed = text.trim();
  const arrayStart = trimmed.indexOf('[');
  if (arrayStart === -1) return null;
  let depth = 0;
  let end = -1;
  for (let i = arrayStart; i < trimmed.length; i++) {
    if (trimmed[i] === '[') depth++;
    if (trimmed[i] === ']') {
      depth--;
      if (depth === 0) {
        end = i;
        break;
      }
    }
  }
  if (end === -1) return null;
  try {
    const parsed = JSON.parse(trimmed.slice(arrayStart, end + 1));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * 末尾が切れたJSON配列から、完全なオブジェクトだけを抽出する。
 * AIがトークン制限で途中切れになった応答でも、有効な要素を利用できるようにする。
 */
function extractCompleteObjectsFromTruncatedArray(text: string): unknown[] {
  const trimmed = text.trim();
  const arrayStart = trimmed.indexOf('[');
  if (arrayStart === -1) return [];
  const result: unknown[] = [];
  let i = arrayStart + 1;
  while (i < trimmed.length) {
    const objStart = trimmed.indexOf('{', i);
    if (objStart === -1) break;
    let depth = 0;
    let objEnd = -1;
    let inString = false;
    let escape = false;
    let quoteChar = '';
    for (let j = objStart; j < trimmed.length; j++) {
      const c = trimmed[j];
      if (escape) {
        escape = false;
        continue;
      }
      if ((c === '\\') && inString) {
        escape = true;
        continue;
      }
      if (!inString) {
        if (c === '{') depth++;
        else if (c === '}') {
          depth--;
          if (depth === 0) {
            objEnd = j;
            break;
          }
        } else if (c === '"' || c === "'") {
          inString = true;
          quoteChar = c;
        }
        continue;
      }
      if (c === quoteChar) inString = false;
    }
    if (objEnd === -1) break;
    const slice = trimmed.slice(objStart, objEnd + 1);
    try {
      const parsed = JSON.parse(slice);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        result.push(parsed);
      }
    } catch {
      // このオブジェクトはパース失敗（不完全など）。スキップ
    }
    i = objEnd + 1;
  }
  return result;
}

/** 不正な要素はスキップまたはデフォルトで補正して SuggestedQuestItem[] に正規化する */
function normalizeSuggestedQuests(raw: unknown[]): SuggestedQuestItem[] {
  const result: SuggestedQuestItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const parsed = suggestedQuestItemSchema.safeParse(item);
    if (parsed.success) {
      result.push(parsed.data);
      continue;
    }
    const o = item as Record<string, unknown>;
    const title = typeof o.title === 'string' && o.title.trim().length > 0 ? o.title.trim() : null;
    if (!title) continue;
    const type =
      typeof o.type === 'string' && Object.values(TaskType).includes(o.type as TaskType)
        ? (o.type as TaskType)
        : TaskType.TODO;
    const difficulty =
      typeof o.difficulty === 'string' && Object.values(Difficulty).includes(o.difficulty as Difficulty)
        ? (o.difficulty as Difficulty)
        : Difficulty.MEDIUM;
    result.push({ title: title.slice(0, 200), type, difficulty });
  }
  return result;
}

function buildSuggestedQuestsPrompt(goal: string): string {
  return [
    'あなたはTRPGのゲームマスターです。冒険者（ユーザー）の目標を達成するためのクエストを提案してください。',
    '以下の目標に基づき、3〜7件のクエストをJSON配列のみで返してください。',
    `冒険者の目標: ${goal}`,
    '【各要素の形式】',
    'title: クエスト名（冒険風の名前で、具体的な行動がわかるように。例: 「英単語の迷宮に挑む」「コードの試練・第一章」）',
    'type: DAILY | HABIT | TODO のいずれか',
    'difficulty: EASY | MEDIUM | HARD のいずれか',
    '【出力】JSON配列のみ。例: [{"title":"英単語の迷宮に挑む","type":"DAILY","difficulty":"MEDIUM"}, ...]',
  ].join('\n');
}

/**
 * 目標を受け取り、3〜7件の実行可能タスクを返す。
 * 出力を既存クエスト形式に正規化し、不正な要素はスキップまたはデフォルトで補正する。
 * AI呼び出し自体が失敗した場合はリトライ後に例外を再送出する（ルートハンドラで502として処理）。
 * AIが応答したがパース不能な場合は空配列を返す（ルートハンドラで503として処理）。
 */
export async function generateSuggestedQuests(
  ai: AiRunBinding,
  goal: string,
  gatewayId?: string
): Promise<SuggestedQuestItem[]> {
  const prompt = buildSuggestedQuestsPrompt(goal);
  const MAX_ATTEMPTS = 2;
  const RETRY_DELAY_MS = 500;

  let lastError: unknown = null;
  let hadParseableResponse = false;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
    try {
      const raw = await runWithLlama31_8b(ai, prompt, gatewayId);
      hadParseableResponse = true;

      if (typeof raw !== 'string' || raw.trim().length === 0) {
        console.warn(`[suggest-quests] attempt=${attempt + 1}/${MAX_ATTEMPTS} empty response`);
        continue;
      }

      let arr: unknown[] | null = extractJsonArray(raw);
      if (arr === null) {
        try {
          const parsed = JSON.parse(raw);
          arr = Array.isArray(parsed) ? parsed : null;
        } catch {
          arr = null;
        }
      }
      // 末尾切れの応答から完全なオブジェクトだけを取り出す（トークン制限で途中切れになる場合対策）
      if (arr === null || arr.length === 0) {
        const recovered = extractCompleteObjectsFromTruncatedArray(raw);
        if (recovered.length > 0) {
          arr = recovered;
          console.warn(
            `[suggest-quests] attempt=${attempt + 1}/${MAX_ATTEMPTS} used ${recovered.length} items from truncated response`
          );
        }
      }

      if (arr === null || arr.length === 0) {
        console.warn(
          `[suggest-quests] attempt=${attempt + 1}/${MAX_ATTEMPTS} unparseable response: ${raw.slice(0, 200)}`
        );
        continue;
      }

      const normalized = normalizeSuggestedQuests(arr);
      if (normalized.length > 0) return normalized;

      console.warn(`[suggest-quests] attempt=${attempt + 1}/${MAX_ATTEMPTS} all items invalid after normalization`);
    } catch (err) {
      lastError = err;
      console.error(`[suggest-quests] attempt=${attempt + 1}/${MAX_ATTEMPTS} error:`, err);
    }
  }

  if (lastError && !hadParseableResponse) {
    throw lastError;
  }
  return [];
}

/**
 * Llama 3.1 8B でキャラクタープロフィールを生成する。
 * プロンプトを構築し、JSON をパースして返す。失敗時はフォールバックプロフィールを返す。
 */
export async function generateCharacter(
  ai: AiRunBinding,
  data: GenesisFormData,
  gatewayId?: string
): Promise<CharacterProfile> {
  const prompt = buildCharacterPrompt(data);
  try {
    const raw = await runWithLlama31_8b(ai, prompt, gatewayId);
    let parsed: unknown = typeof raw === 'string' ? extractJson(raw) : null;
    if (parsed === null && typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }
    if (isCharacterProfile(parsed)) {
      return parsed as CharacterProfile;
    }
  } catch {
    // fall through to fallback
  }
  return defaultCharacterProfile(data.name, data.goal);
}

function buildCharacterPrompt(data: GenesisFormData): string {
  return [
    'あなたはノベルゲー／TRPGの世界を紡ぐゲームマスターです。',
    '冒険者（プレイヤー）のプロフィールを生成し、JSONのみで返してください。',
    `冒険者の名前: ${data.name}`,
    `冒険者の目標: ${data.goal}`,
    '【生成ルール】',
    `- name: 「${data.name}」をそのまま使用。`,
    '- className: 目標に応じたTRPG的なクラス名（例: 目標が語学なら「言霊使い」、プログラミングなら「魔導技師」、資格なら「賢者見習い」など）。',
    '- title: 冒険者の二つ名・称号（例: 「暁の探求者」「未踏の挑戦者」）。',
    '- prologue: この冒険者の物語の始まりを2〜3文で描写する。目標に向かって旅立つ導入シーンを、ノベルゲーの冒頭のように情景豊かに書く。',
    '- themeColor: キャラクターの雰囲気に合う色（#で始まる6桁のカラーコード）。',
    '- level: 1, currentXp: 0, nextLevelXp: 100, gold: 0（固定）。',
    '必須フィールド: name, className, title, prologue, themeColor, level, currentXp, nextLevelXp, gold。',
  ].join('\n');
}


/** 難易度に応じた報酬（フォールバック用）。Req 5.2 / geminiService の範囲に合わせる。 */
function difficultyBasedRewards(difficulty: Difficulty): { rewardXp: number; rewardGold: number } {
  switch (difficulty) {
    case Difficulty.EASY:
      return { rewardXp: 15, rewardGold: 8 };
    case Difficulty.MEDIUM:
      return { rewardXp: 30, rewardGold: 18 };
    case Difficulty.HARD:
      return { rewardXp: 60, rewardGold: 35 };
    default:
      return { rewardXp: 20, rewardGold: 10 };
  }
}

function isNarrativeResult(obj: unknown): obj is NarrativeResult {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.narrative === 'string' &&
    typeof o.rewardXp === 'number' &&
    typeof o.rewardGold === 'number'
  );
}

function buildNarrativePrompt(request: NarrativeRequest): string {
  const comment = request.userComment ? `冒険者のコメント: ${request.userComment}` : '';
  return [
    'あなたはTRPGのゲームマスターです。冒険者がクエストをクリアした瞬間の物語セグメントを生成してください。',
    'この物語はグリモワール（冒険日誌）に記録されるストーリーログの1ページとなります。',
    `クリアしたクエスト: ${request.taskTitle} (種別: ${request.taskType}, 難易度: ${request.difficulty})`,
    comment,
    '【出力ルール】',
    '1. narrative: クエストクリアの瞬間をノベルゲーの1シーンのように描写する（2〜3文）。冒険者の成長や達成感が伝わるように。',
    '2. rewardXp: 難易度に応じた経験値 (EASY: 10-20, MEDIUM: 25-40, HARD: 50-80)',
    '3. rewardGold: 難易度に応じたゴールド (EASY: 5-10, MEDIUM: 15-25, HARD: 30-50)',
    '必須フィールド: narrative, rewardXp, rewardGold。JSONのみで返してください。',
  ].join('\n').trim();
}

/**
 * Llama 3.1 8B で物語セグメントと報酬を生成する。
 * タスク情報とユーザーコメントをプロンプトに含め、難易度に応じた報酬はAIまたはフォールバックで算出する。
 */
export async function generateNarrative(
  ai: AiRunBinding,
  request: NarrativeRequest,
  gatewayId?: string
): Promise<NarrativeResult> {
  const prompt = buildNarrativePrompt(request);
  
  try {
    const raw = await runWithLlama31_8b(ai, prompt, gatewayId);
    let parsed: unknown = typeof raw === 'string' ? extractJson(raw) : null;
    if (parsed === null && typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }
    if (isNarrativeResult(parsed)) {
      return parsed;
    }
  } catch {
    // fall through to fallback
  }
  const rewards = difficultyBasedRewards(request.difficulty);
  return {
    narrative: `冒険者は「${request.taskTitle}」のクエストを見事クリアした。新たな経験が血肉となり、次なる冒険への力が静かに湧き上がる。`,
    rewardXp: rewards.rewardXp,
    rewardGold: rewards.rewardGold,
  };
}

const DEFAULT_PARTNER_MESSAGE = 'お疲れ様、冒険者。次のクエストの話でもしようか。';

function buildPartnerMessagePrompt(request: PartnerMessageRequest): string {
  const lines = [
    'あなたはサイバーパンク都市のバーで働くスタッフ（ウェイトレスまたはウェイター）です。',
    '冒険者（ユーザー）にとっての「相棒」であり、クエストを一緒に見守り、励ます存在です。',
    '【状況】',
  ];
  if (request.timeOfDay) {
    lines.push(`時間帯: ${request.timeOfDay}`);
  }
  if (request.progressSummary) {
    lines.push(`冒険者の進捗: ${request.progressSummary}`);
  }
  if (request.currentTaskTitle) {
    lines.push(`現在のクエスト: ${request.currentTaskTitle}`);
  }
  lines.push(
    '【性格・トーン】',
    '- 優しく親しみやすい。砕けた口調（です・ます調は使わない）。',
    '- 失敗しても責めない。「また挑戦しよう」と前向きに励ます。',
    '- バーの常連を迎えるように、安心感と応援の気持ちを込めて話す。',
  );
  return lines.join('\n');
}

/**
 * Llama 3.1 8B でパートナーの動的セリフを生成する。
 * 時間帯・進捗状況・タスク状態をプロンプトに含める。
 */
export async function generatePartnerMessage(
  ai: AiRunBinding,
  request: PartnerMessageRequest,
  gatewayId?: string
): Promise<string> {
  const prompt = buildPartnerMessagePrompt(request);
  try {
    const raw = await runWithLlama31_8b(ai, prompt, gatewayId);
    const trimmed = typeof raw === 'string' ? raw.trim() : '';
    if (trimmed.length > 0) return trimmed;
  } catch {
    // fall through to fallback
  }
  return DEFAULT_PARTNER_MESSAGE;
}

function buildGrimoirePrompt(completedTasks: CompletedTask[], context?: GrimoireContext): string {
  if (completedTasks.length === 0) {
    return '完了したタスクがありません。';
  }
  
  const taskList = completedTasks.map((task, index) => {
    const completedDate = new Date(task.completedAt * 1000).toLocaleDateString('ja-JP');
    return `${index + 1}. ${task.title} (種別: ${task.type}, 難易度: ${task.difficulty}, 完了日: ${completedDate})`;
  }).join('\n');

  const lines: string[] = [
    'あなたはTRPGのゲームマスターです。',
    '冒険者のグリモワール（冒険日誌）の章タイトルと、今回クリアしたクエストに応じた報酬（経験値・ゴールド）のみを生成してください。',
  ];

  if (context) {
    lines.push(
      '',
      '【冒険者プロフィール】',
      `名前: ${context.characterName}`,
      `クラス: ${context.className}`,
      `称号: ${context.title}`,
      `レベル: ${context.level}`,
      `目標: ${context.goal}`,
    );

    if (context.previousNarratives.length > 0) {
      lines.push(
        '',
        '【前回までのあらすじ】',
        '以下はこの冒険者のグリモワールに記された直近の記録です。今回の物語はこの続きとして書いてください。',
      );
      context.previousNarratives.forEach((narrative, i) => {
        lines.push(`--- 記録${i + 1} ---`, narrative);
      });
    }
  }

  lines.push(
    '',
    '【今回クリアしたクエスト】',
    taskList,
    '',
    '【出力ルール】',
    'title: この章の冒険を象徴する章タイトル。章番号（第X章）は付けないこと。例: 「コードの迷宮と言霊の試練」「暁の探求者、新たな扉を開く」「今日の収穫」。',
    'rewardXp: 完了したクエストの合計経験値（各難易度に応じて: EASY: 10-20, MEDIUM: 25-40, HARD: 50-80）。',
    'rewardGold: 完了したクエストの合計ゴールド（各難易度に応じて: EASY: 5-10, MEDIUM: 15-25, HARD: 30-50）。',
    '必須フィールド: title, rewardXp, rewardGold。JSONのみで返してください。',
  );

  return lines.join('\n');
}

function isGrimoireTitleAndRewardsResult(obj: unknown): obj is GrimoireTitleAndRewards {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.title === 'string' &&
    typeof o.rewardXp === 'number' &&
    typeof o.rewardGold === 'number'
  );
}

/**
 * フォールバック用のタイトル・報酬を算出する（AI失敗時・0件時）。
 */
export function getGrimoireFallbackTitleAndRewards(
  completedTasks: CompletedTask[],
  characterName: string
): GrimoireTitleAndRewards {
  const templates = grimoireTemplates as { titleFallback: { zeroTasks: string; oneTask: string; multipleTasks: string } };
  const dateStr = completedTasks.length > 0
    ? new Date(Math.max(...completedTasks.map(t => t.completedAt * 1000))).toLocaleDateString('ja-JP')
    : new Date().toLocaleDateString('ja-JP');

  if (completedTasks.length === 0) {
    return {
      title: templates.titleFallback.zeroTasks,
      rewardXp: 0,
      rewardGold: 0,
    };
  }
  if (completedTasks.length === 1) {
    const taskTitle = truncateTaskTitle(completedTasks[0].title);
    const title = templates.titleFallback.oneTask
      .replace('{date}', dateStr)
      .replace('{taskTitle}', taskTitle);
    const rewards = difficultyBasedRewards(completedTasks[0].difficulty as Difficulty);
    return { title, rewardXp: rewards.rewardXp, rewardGold: rewards.rewardGold };
  }
  const title = templates.titleFallback.multipleTasks
    .replace('{date}', dateStr)
    .replace('{taskCount}', String(completedTasks.length));
  const total = completedTasks.reduce(
    (acc, task) => {
      const r = difficultyBasedRewards(task.difficulty as Difficulty);
      return { xp: acc.xp + r.rewardXp, gold: acc.gold + r.rewardGold };
    },
    { xp: 0, gold: 0 }
  );
  return { title, rewardXp: total.xp, rewardGold: total.gold };
}

const TASK_TITLE_MAX_LEN = 30;

function truncateTaskTitle(title: string): string {
  if (title.length <= TASK_TITLE_MAX_LEN) return title;
  return title.slice(0, TASK_TITLE_MAX_LEN) + '…';
}

const TASK_TYPE_LABELS: Record<string, string> = {
  [TaskType.DAILY]: '日課',
  [TaskType.HABIT]: '習慣',
  [TaskType.TODO]: '討伐',
};

const DIFFICULTY_LABELS: Record<string, string> = {
  [Difficulty.EASY]: '易',
  [Difficulty.MEDIUM]: '中',
  [Difficulty.HARD]: '難',
};

/**
 * テンプレートJSONと変数からナラティブ文字列を組み立てる。
 * 設計: docs/product/grimoire-system-design.md
 */
export function buildGrimoireNarrativeFromTemplate(
  completedTasks: CompletedTask[],
  characterName: string,
  rewardXp: number,
  rewardGold: number
): string {
  const t = grimoireTemplates as {
    narrative: { zeroTasks: string; oneTask: string; multipleTasks: string };
  };
  const dateStr = completedTasks.length > 0
    ? new Date(Math.max(...completedTasks.map(task => task.completedAt * 1000))).toLocaleDateString('ja-JP')
    : new Date().toLocaleDateString('ja-JP');

  const replace = (s: string, vars: Record<string, string | number>) => {
    let out = s;
    for (const [key, value] of Object.entries(vars)) {
      out = out.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value));
    }
    return out;
  };

  if (completedTasks.length === 0) {
    return replace(t.narrative.zeroTasks, { characterName });
  }
  if (completedTasks.length === 1) {
    const task = completedTasks[0];
    return replace(t.narrative.oneTask, {
      date: dateStr,
      characterName,
      taskTitle: truncateTaskTitle(task.title),
      taskTypeLabel: TASK_TYPE_LABELS[task.type] ?? '討伐',
      difficultyLabel: DIFFICULTY_LABELS[task.difficulty] ?? '中',
      totalXp: rewardXp,
      totalGold: rewardGold,
    });
  }
  const taskTitles = completedTasks.map(task => `『${truncateTaskTitle(task.title)}』`).join('');
  return replace(t.narrative.multipleTasks, {
    date: dateStr,
    characterName,
    taskCount: completedTasks.length,
    taskTitles,
    totalXp: rewardXp,
    totalGold: rewardGold,
  });
}

/**
 * Llama 3.1 8B でグリモワールの章タイトルと報酬のみを生成する。
 * ナラティブは buildGrimoireNarrativeFromTemplate でテンプレートから組み立てる。
 */
export async function generateGrimoire(
  ai: AiRunBinding,
  completedTasks: CompletedTask[],
  gatewayId?: string,
  context?: GrimoireContext
): Promise<GrimoireTitleAndRewards> {
  if (completedTasks.length === 0) {
    return getGrimoireFallbackTitleAndRewards([], context?.characterName ?? '冒険者');
  }

  const prompt = buildGrimoirePrompt(completedTasks, context);

  try {
    const raw = await runWithLlama31_8b(ai, prompt, gatewayId);
    let parsed: unknown = typeof raw === 'string' ? extractJson(raw) : null;
    if (parsed === null && typeof raw === 'string') {
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = null;
      }
    }
    if (isGrimoireTitleAndRewardsResult(parsed)) {
      const o = parsed as GrimoireTitleAndRewards;
      const title = o.title.trim().length > 0 ? o.title.trim() : (context?.characterName ?? '冒険者') + 'の冒険記';
      return { title, rewardXp: o.rewardXp, rewardGold: o.rewardGold };
    }
  } catch {
    // fall through to fallback
  }

  return getGrimoireFallbackTitleAndRewards(completedTasks, context?.characterName ?? '冒険者');
}
