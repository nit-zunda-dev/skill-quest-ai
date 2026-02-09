import type { Bindings } from '../types';
import type { CharacterProfile, GenesisFormData, CharacterStats } from '@skill-quest/shared';
import type { NarrativeRequest, PartnerMessageRequest } from '@skill-quest/shared';
import { Difficulty } from '@skill-quest/shared';

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

/** ナラティブ生成の戻り値（物語セグメントと報酬） */
export interface NarrativeResult {
  narrative: string;
  rewardXp: number;
  rewardGold: number;
  rewardHp?: number;
  rewardStats?: Partial<CharacterStats>;
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
    generateNarrative(request: NarrativeRequest) {
      return generateNarrative(ai, request);
    },
    generatePartnerMessage(request: PartnerMessageRequest) {
      return generatePartnerMessage(ai, request);
    },
    generateGrimoire(completedTasks: CompletedTask[]) {
      return generateGrimoire(ai, completedTasks);
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
    `必須フィールド: name, className, title, stats(strength,intelligence,charisma,willpower,luck), prologue, themeColor(#で始まる6桁色), level, currentXp, nextLevelXp, hp, maxHp, gold.`,
    `statsの各値は0以上100以下、合計250にすること。nameは「${data.name}」にすること。`,
  ].join('\n');
}

/** ランダムな整数を生成する（min以上max以下、マイナスも含む） */
function randomInRange(min: number, max: number): number {
  const range = max - min + 1;
  return Math.floor(Math.random() * range) + min;
}

/** ランダムに増減する値を生成（minからmaxの範囲で、符号もランダム） */
function randomSignedRange(min: number, max: number): number {
  const absValue = randomInRange(min, max);
  const sign = Math.random() < 0.5 ? -1 : 1;
  return sign * absValue;
}

/** 難易度に応じたHPと能力値のランダム報酬を生成 */
function generateRandomRewards(difficulty: Difficulty): {
  rewardHp: number;
  rewardStats: Partial<CharacterStats>;
} {
  let hpRange: [number, number];
  let statRange: [number, number];

  switch (difficulty) {
    case Difficulty.EASY:
      hpRange = [5, 10];
      statRange = [1, 2];
      break;
    case Difficulty.MEDIUM:
      hpRange = [8, 15];
      statRange = [1, 3];
      break;
    case Difficulty.HARD:
      hpRange = [12, 20];
      statRange = [2, 5];
      break;
    default:
      hpRange = [5, 10];
      statRange = [1, 2];
  }

  // HPは増減両方（ランダム）
  const rewardHp = randomSignedRange(hpRange[0], hpRange[1]);
  // 能力値はプラスのみ（ランダム）
  const rewardStats: Partial<CharacterStats> = {
    strength: randomInRange(statRange[0], statRange[1]),
    intelligence: randomInRange(statRange[0], statRange[1]),
    charisma: randomInRange(statRange[0], statRange[1]),
    willpower: randomInRange(statRange[0], statRange[1]),
    luck: randomInRange(statRange[0], statRange[1]),
  };

  return { rewardHp, rewardStats };
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
    '1. narrative: タスク完了をクトゥルフ神話TRPGのアクションとして誇張的に描写する（2文程度）。',
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
  request: NarrativeRequest
): Promise<NarrativeResult> {
  const prompt = buildNarrativePrompt(request);
  const randomRewards = generateRandomRewards(request.difficulty);
  
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
    if (isNarrativeResult(parsed)) {
      return {
        ...parsed,
        rewardHp: randomRewards.rewardHp,
        rewardStats: randomRewards.rewardStats,
      };
    }
  } catch {
    // fall through to fallback
  }
  const rewards = difficultyBasedRewards(request.difficulty);
  return {
    narrative: `${request.taskTitle}を達成した。心地よい疲労感と共に、力が湧いてくるのを感じる。`,
    rewardXp: rewards.rewardXp,
    rewardGold: rewards.rewardGold,
    rewardHp: randomRewards.rewardHp,
    rewardStats: randomRewards.rewardStats,
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
  request: PartnerMessageRequest
): Promise<string> {
  const prompt = buildPartnerMessagePrompt(request);
  try {
    const raw = await runWithLlama31_8b(ai, prompt);
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
  completedTasks: CompletedTask[]
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
    const raw = await runWithLlama31_8b(ai, prompt);
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
