import type { Bindings } from '../types';
import type { CharacterProfile, GenesisFormData } from '@skill-quest/shared';
import type { NarrativeRequest, PartnerMessageRequest, SuggestedQuestItem } from '@skill-quest/shared';
import { Difficulty, TaskType } from '@skill-quest/shared';
import { suggestedQuestItemSchema } from '@skill-quest/shared';

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

export interface GrimoireGenerationResult {
  narrative: string;
  rewardXp: number;
  rewardGold: number;
}

export interface AiService {
  runWithLlama31_8b(prompt: string): Promise<string>;
  runWithLlama33_70b(prompt: string): Promise<string>;
  generateCharacter(data: GenesisFormData): Promise<CharacterProfile>;
  generateNarrative(request: NarrativeRequest): Promise<NarrativeResult>;
  generatePartnerMessage(request: PartnerMessageRequest): Promise<string>;
  generateGrimoire(completedTasks: CompletedTask[]): Promise<GrimoireGenerationResult>;
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
      narrative: 'Stub grimoire.',
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
    generateGrimoire(completedTasks: CompletedTask[]) {
      return generateGrimoire(ai, completedTasks, gatewayId);
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
    'あなたは目標を実行可能なタスクに分解するアシスタントです。',
    '以下の目標に基づき、3〜7件のタスクをJSON配列のみで返してください。',
    `目標: ${goal}`,
    '【各要素の形式】',
    'title: タスクのタイトル（1件につき1文で具体的に）',
    'type: DAILY | HABIT | TODO のいずれか',
    'difficulty: EASY | MEDIUM | HARD のいずれか',
    '【出力】JSON配列のみ。例: [{"title":"毎日30分勉強する","type":"DAILY","difficulty":"MEDIUM"}, ...]',
  ].join('\n');
}

/**
 * 目標を受け取り、3〜7件の実行可能タスクを返す。
 * 出力を既存クエスト形式に正規化し、不正な要素はスキップまたはデフォルトで補正する。
 * 失敗時は空配列を返す。
 */
export async function generateSuggestedQuests(
  ai: AiRunBinding,
  goal: string,
  gatewayId?: string
): Promise<SuggestedQuestItem[]> {
  try {
    const prompt = buildSuggestedQuestsPrompt(goal);
    const raw = await runWithLlama31_8b(ai, prompt, gatewayId);
    let arr: unknown[] | null = typeof raw === 'string' ? extractJsonArray(raw) : null;
    if (arr === null && typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        arr = Array.isArray(parsed) ? parsed : null;
      } catch {
        arr = null;
      }
    }
    if (arr === null || arr.length === 0) return [];
    return normalizeSuggestedQuests(arr);
  } catch {
    return [];
  }
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
    `以下の条件でゲームのキャラクターを1体生成し、JSONのみで返してください。`,
    `名前: ${data.name}`,
    `目標: ${data.goal}`,
    `必須フィールド: name, className, title, prologue, themeColor(#で始まる6桁色), level, currentXp, nextLevelXp, gold.`,
    `nameは「${data.name}」にすること。`,
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
  const comment = request.userComment ? `ユーザーのコメント: ${request.userComment}` : 'ユーザーのコメント: なし';
  return [
    'あなたはTRPGのゲームマスターです。TRPGのタスク完了イベントを生成し、JSONのみで返してください。',
    `完了したタスク: ${request.taskTitle} (タスク種別: ${request.taskType}, 難易度: ${request.difficulty})`,
    comment,
    '【出力ルール】',
    '1. narrative: タスク完了をTRPGのアクションとして誇張的に描写する（2文程度）。',
    '2. rewardXp: 難易度に応じた経験値 (EASY: 10-20, MEDIUM: 25-40, HARD: 50-80)',
    '3. rewardGold: 難易度に応じた報酬 (EASY: 5-10, MEDIUM: 15-25, HARD: 30-50)',
    '必須フィールド: narrative, rewardXp, rewardGold。JSON以外は出力しないこと。',
  ].join('\n');
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
    narrative: `${request.taskTitle}を達成した。心地よい疲労感と共に、力が湧いてくるのを感じる。`,
    rewardXp: rewards.rewardXp,
    rewardGold: rewards.rewardGold,
  };
}

const DEFAULT_PARTNER_MESSAGE = '一緒に頑張ろう。';

function buildPartnerMessagePrompt(request: PartnerMessageRequest): string {
  const lines = [
    'あなたはRPGの相棒キャラクターです。プレイヤーに短く（1文）声をかけてください。',
    '【状況】',
  ];
  if (request.timeOfDay) {
    lines.push(`時間帯: ${request.timeOfDay}`);
  }
  if (request.progressSummary) {
    lines.push(`進捗状況: ${request.progressSummary}`);
  }
  if (request.currentTaskTitle) {
    lines.push(`現在のタスク: ${request.currentTaskTitle}`);
  }
  lines.push('【性格】頼れる相棒。です・ます調ではなく、砕けた口調で。');
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

function buildGrimoirePrompt(completedTasks: CompletedTask[]): string {
  if (completedTasks.length === 0) {
    return '完了したタスクがありません。';
  }
  
  const taskList = completedTasks.map((task, index) => {
    const completedDate = new Date(task.completedAt * 1000).toLocaleDateString('ja-JP');
    return `${index + 1}. ${task.title} (種別: ${task.type}, 難易度: ${task.difficulty}, 完了日: ${completedDate})`;
  }).join('\n');
  
  return [
    'あなたはTRPGのゲームマスターです。完了したタスクすべてを参考に、冒険の記録（グリモワールエントリ）を生成し、JSONのみで返してください。',
    '【完了したタスク一覧】',
    taskList,
    '【出力ルール】',
    '1. narrative: 完了したタスクすべてを統合した物語として、冒険の記録を2-3文で描写してください。',
    '2. rewardXp: 完了したタスクの合計経験値（各タスクの難易度に応じて: EASY: 10-20, MEDIUM: 25-40, HARD: 50-80）',
    '3. rewardGold: 完了したタスクの合計報酬（各タスクの難易度に応じて: EASY: 5-10, MEDIUM: 15-25, HARD: 30-50）',
    '必須フィールド: narrative, rewardXp, rewardGold。JSON以外は出力しないこと。',
  ].join('\n');
}

function isGrimoireResult(obj: unknown): obj is GrimoireGenerationResult {
  if (!obj || typeof obj !== 'object') return false;
  const o = obj as Record<string, unknown>;
  return (
    typeof o.narrative === 'string' &&
    typeof o.rewardXp === 'number' &&
    typeof o.rewardGold === 'number'
  );
}

/**
 * Llama 3.1 8B でグリモワールエントリを生成する。
 * 完了したタスクすべてを参考に、統合された物語と報酬を生成する。
 */
export async function generateGrimoire(
  ai: AiRunBinding,
  completedTasks: CompletedTask[],
  gatewayId?: string
): Promise<GrimoireGenerationResult> {
  if (completedTasks.length === 0) {
    return {
      narrative: 'まだ完了したタスクがありません。冒険を続けましょう。',
      rewardXp: 0,
      rewardGold: 0,
    };
  }
  
  const prompt = buildGrimoirePrompt(completedTasks);
  
  // フォールバック用の報酬計算
  const totalRewards = completedTasks.reduce(
    (acc, task) => {
      let xp = 0;
      let gold = 0;
      switch (task.difficulty) {
        case 'EASY':
          xp = 15;
          gold = 8;
          break;
        case 'MEDIUM':
          xp = 30;
          gold = 18;
          break;
        case 'HARD':
          xp = 60;
          gold = 35;
          break;
        default:
          xp = 20;
          gold = 10;
      }
      return { xp: acc.xp + xp, gold: acc.gold + gold };
    },
    { xp: 0, gold: 0 }
  );
  
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
    if (isGrimoireResult(parsed)) {
      return parsed;
    }
  } catch {
    // fall through to fallback
  }
  
  // フォールバック
  const taskTitles = completedTasks.map(t => t.title).join('、');
  return {
    narrative: `今日は${completedTasks.length}つのタスクを達成した。${taskTitles}。これらの成果は、冒険者としての成長の証である。`,
    rewardXp: totalRewards.xp,
    rewardGold: totalRewards.gold,
  };
}
