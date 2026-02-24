/**
 * 文脈（UI状態）と会話内容から表示用表情へマッピング（Task 2.1, Requirements 3.1–3.5）
 * パートナーページとウィジェットの両方で同じルールを参照する。
 * 5種類の表情（default / smile / cheer / happy / worried）を会話に合わせてフル活用する。
 */
import type { PartnerExpression } from '@/lib/partner-assets';

/** 待機・送信中・達成・未達フォローなどのUI状態 */
export type PartnerDisplayContext = 'idle' | 'loading' | 'success' | 'retry';

const CONTEXT_TO_EXPRESSION: Record<PartnerDisplayContext, PartnerExpression> = {
  idle: 'default',
  loading: 'cheer',
  success: 'happy',
  retry: 'worried',
};

/** チャットメッセージ（role + content） */
export type ChatMessage = { role: string; content: string };

/** 表情判定の入力（ローディング中か＋直近のAI発言） */
export type PartnerExpressionInput = {
  isLoading: boolean;
  messages: ChatMessage[];
};

/** 応援・励まし系キーワード → cheer */
const CHEER_KEYWORDS = [
  '頑張', '応援', '一緒に', 'できる', '大丈夫だよ', 'きっと', '乗り越え', '踏ん張',
  'ファイト', 'あと少し', '信じて', 'やってみ', '挑戦',
];

/** 心配・フォロー系キーワード → worried */
const WORRIED_KEYWORDS = [
  '心配', '無理しない', '休んで', '大丈夫？', '辛い', 'つらい', '大丈夫、', '無理しな',
  'ゆっくり', '焦らなく', '落ち込まない', '悲し', '困った',
];

/** 喜び・祝福系キーワード → happy */
const HAPPY_KEYWORDS = [
  'おめでとう', 'よかった', 'すごい', '嬉しい', 'やった', '素敵', '最高', '完璧',
  'できたね', 'よくやった', '称賛', '感謝', 'ありがとう',
];

/** 穏やか肯定・笑顔系キーワード → smile */
const SMILE_KEYWORDS = [
  'そうだね', 'いいね', 'うん', 'ね', 'そうそう', 'わかった', '了解', 'もちろん',
  '笑', 'ですね', 'だね', 'いいよ', 'オッケー', 'OK',
];

function matchKeywords(text: string, keywords: string[]): boolean {
  const lower = text.trim().toLowerCase();
  return keywords.some((k) => lower.includes(k.toLowerCase()));
}

/**
 * 直近のアシスタント発言の内容から表情を推定する。
 * 複数マッチ時は優先度: worried > cheer > happy > smile（強い感情を優先）。
 */
export function getExpressionFromLastAssistantContent(
  content: string | null
): Exclude<PartnerExpression, 'standing' | 'default'> | null {
  if (!content || !content.trim()) return null;
  if (matchKeywords(content, WORRIED_KEYWORDS)) return 'worried';
  if (matchKeywords(content, CHEER_KEYWORDS)) return 'cheer';
  if (matchKeywords(content, HAPPY_KEYWORDS)) return 'happy';
  if (matchKeywords(content, SMILE_KEYWORDS)) return 'smile';
  return null;
}

/**
 * 会話状態に応じた表示用表情を返す。
 * - ローディング中: cheer（応援中）
 * - メッセージなし: default
 * - 直近のAI発言あり: 内容から cheer / worried / happy / smile を推定し、チャット終了後もその表情を維持（default に戻さない）
 */
export function getExpressionForPartner(input: PartnerExpressionInput): PartnerExpression {
  if (input.isLoading) return 'cheer';

  const messages = input.messages.filter((m) => m.content.trim() !== '');
  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant');
  const lastContent = lastAssistant?.content ?? null;

  const inferred = getExpressionFromLastAssistantContent(lastContent);
  if (inferred) return inferred;

  return messages.length === 0 ? 'default' : 'smile';
}

/**
 * 文脈に応じた表示用表情を返す。未定義の文脈の場合は default にフォールバックする。
 * @deprecated 新規は getExpressionForPartner を使用し、会話内容で表情を切り替えること。
 */
export function getExpressionFromContext(
  context: PartnerDisplayContext
): PartnerExpression {
  return CONTEXT_TO_EXPRESSION[context] ?? 'default';
}
