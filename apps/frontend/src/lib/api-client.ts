/**
 * AI API クライアント
 * タスク 11.1: Gemini API を廃止し、バックエンド API（Workers AI）を呼び出す
 */
import { client } from './client';
import {
  type AcquiredItemView,
  type CharacterProfile,
  type CreateQuestBatchRequest,
  type GenesisFormData,
  type Item,
  type SuggestQuestsRequest,
  type SuggestedQuestItem,
  type Task,
  type UpdateGoalRequest,
  Difficulty,
} from '@skill-quest/shared';

type HcClient = {
  api: {
    ai: {
      character: { $get: () => Promise<Response> };
      'generate-character': { $post: (opts: { json: GenesisFormData }) => Promise<Response> };
      'generate-narrative': { $post: (opts: { json: object }) => Promise<Response> };
      'generate-partner-message': { $post: (opts: { json: object }) => Promise<Response> };
      'suggest-quests': { $post: (opts: { json: SuggestQuestsRequest }) => Promise<Response> };
      goal: { $patch: (opts: { json: UpdateGoalRequest }) => Promise<Response> };
    };
    quests: {
      batch: { $post: (opts: { json: CreateQuestBatchRequest }) => Promise<Response> };
    };
    items: {
      $get: () => Promise<Response>;
      master: { $get: () => Promise<Response> };
    };
    users: {
      ':userId': { $delete: (opts: { param: { userId: string } }) => Promise<Response> };
    };
  };
};
const api = (client as HcClient).api;

/** アカウント削除（本人のみ。削除後はログアウト扱い） */
export async function deleteAccount(userId: string): Promise<void> {
  const res = await (client as HcClient).api.users[':userId'].$delete({ param: { userId } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(err?.message ?? `アカウント削除に失敗しました (${res.status})`);
  }
}

/** プロフィールの数値フィールドを正規化（undefined/文字列で NaN を防ぐ）。GET character と Dashboard 初期化で利用。 */
export function normalizeProfileNumbers(p: CharacterProfile): CharacterProfile {
  return {
    ...p,
    level: Number(p.level) || 0,
    currentXp: Number(p.currentXp) || 0,
    nextLevelXp: Number(p.nextLevelXp) || 100,
    gold: Number(p.gold) || 0,
  };
}

/** 保存済みキャラクタープロフィール取得（ログイン時用） */
export async function getCharacterProfile(): Promise<CharacterProfile | null> {
  try {
    const res = await (client as HcClient).api.ai.character.$get();
    if (!res.ok) return null;
    const profile = (await res.json()) as CharacterProfile;
    return normalizeProfileNumbers(profile);
  } catch {
    return null;
  }
}

export interface NarrativeResult {
  narrative: string;
  xp: number;
  gold: number;
  profile?: CharacterProfile;
  grimoireEntry?: { id: string; date: string; taskTitle: string; narrative: string; rewardXp: number; rewardGold: number };
  /** クエスト完了時に付与されたアイテム（付与なしは null） */
  grantedItem?: Item | null;
}

const FALLBACK_PROFILE = (name: string): CharacterProfile => ({
  name,
  className: '冒険者',
  title: '始まりの旅人',
  prologue: '新たな冒険の幕が開けます。',
  themeColor: '#6366f1',
  level: 1,
  currentXp: 0,
  nextLevelXp: 100,
  gold: 0,
});

export async function generateCharacter(data: GenesisFormData): Promise<CharacterProfile> {
  try {
    const res = await api.ai['generate-character'].$post({ json: data });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.warn('generateCharacter API error:', res.status, err);
      return FALLBACK_PROFILE(data.name);
    }
    return (await res.json()) as CharacterProfile;
  } catch (e) {
    console.error('generateCharacter error:', e);
    return FALLBACK_PROFILE(data.name);
  }
}

export async function generateTaskNarrative(
  task: Task,
  userComment: string,
  _profile: CharacterProfile
): Promise<NarrativeResult> {
  try {
    const body = {
      taskId: task.id,
      taskTitle: task.title,
      taskType: task.type,
      difficulty: task.difficulty,
      userComment: userComment || undefined,
    };
    const res = await api.ai['generate-narrative'].$post({ json: body });
    if (!res.ok) {
      console.warn('generateTaskNarrative API error:', res.status);
      return createFallbackNarrative(task);
    }
    const raw = (await res.json()) as {
      narrative?: string;
      rewardXp?: number;
      rewardGold?: number;
      profile?: CharacterProfile;
      grimoireEntry?: { id: string; date: string; taskTitle: string; narrative: string; rewardXp: number; rewardGold: number };
      grantedItem?: Item | null;
    };
    const profile = raw.profile ? normalizeProfileNumbers(raw.profile) : undefined;
    return {
      narrative: raw.narrative ?? '',
      xp: Number(raw.rewardXp) || 0,
      gold: Number(raw.rewardGold) || 0,
      profile,
      grimoireEntry: raw.grimoireEntry,
      grantedItem: raw.grantedItem ?? null,
    };
  } catch (e) {
    console.error('generateTaskNarrative error:', e);
    return createFallbackNarrative(task);
  }
}

function createFallbackNarrative(task: Task): NarrativeResult {
  const baseReward =
    task.difficulty === Difficulty.HARD ? 50 : task.difficulty === Difficulty.MEDIUM ? 30 : 15;

  return {
    narrative: `${task.title}を達成した！心地よい疲労感と共に、力が湧いてくるのを感じる。`,
    xp: baseReward,
    gold: Math.floor(baseReward / 2),
  };
}

export async function generatePartnerMessage(
  _profile: CharacterProfile,
  tasks: Task[]
): Promise<string> {
  try {
    const pending = tasks.filter((t) => !t.completed).length;
    const completed = tasks.filter((t) => t.completed).length;
    const hour = new Date().getHours();
    const timeOfDay = hour < 12 ? '朝' : hour < 18 ? '昼' : '夜';
    const body = {
      progressSummary: `未完了 ${pending}、完了 ${completed}`,
      timeOfDay,
      currentTaskTitle: tasks.find((t) => !t.completed)?.title,
    };
    const res = await api.ai['generate-partner-message'].$post({ json: body });
    if (!res.ok) {
      return '次の冒険の準備はできているか？';
    }
    const data = (await res.json()) as { message: string };
    return data.message?.trim() || '調子はどうだ？';
  } catch (e) {
    return '次の冒険の準備はできているか？';
  }
}

/** 提案取得（POST /api/ai/suggest-quests）。目標とオプションのジャンルで AI がタスク提案を返す。 */
export async function suggestQuests(req: SuggestQuestsRequest): Promise<SuggestedQuestItem[]> {
  const res = await api.ai['suggest-quests'].$post({ json: req });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(err?.message ?? err?.error ?? `提案の取得に失敗しました (${res.status})`);
  }
  const data = (await res.json()) as { suggestions: SuggestedQuestItem[] };
  return data.suggestions ?? [];
}

/** 目標更新（PATCH /api/ai/goal）。1日2回まで。超過時は429。 */
export async function updateGoal(req: UpdateGoalRequest): Promise<void> {
  const res = await api.ai.goal.$patch({ json: req });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(err?.message ?? err?.error ?? `目標の更新に失敗しました (${res.status})`);
  }
}

/** クエスト一括作成（POST /api/quests/batch）。作成されたクエスト一覧を返す。 */
export async function createQuestsBatch(req: CreateQuestBatchRequest): Promise<Task[]> {
  const res = await api.quests.batch.$post({ json: req });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(err?.message ?? err?.error ?? `クエストの一括作成に失敗しました (${res.status})`);
  }
  return (await res.json()) as Task[];
}

/** 所持アイテム一覧取得（GET /api/items）。認証ユーザー本人の所持のみ。Task 6.1 */
export async function getAcquiredItems(): Promise<AcquiredItemView[]> {
  const res = await api.items.$get();
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(err?.message ?? err?.error ?? `所持一覧の取得に失敗しました (${res.status})`);
  }
  const data = (await res.json()) as { items: AcquiredItemView[] };
  return data.items ?? [];
}

/** アイテムマスタ全件取得（GET /api/items/master）。コレクション図鑑用。 */
export async function getItemMaster(): Promise<Item[]> {
  const res = await api.items.master.$get();
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string; error?: string };
    throw new Error(err?.message ?? err?.error ?? `アイテム一覧の取得に失敗しました (${res.status})`);
  }
  const data = (await res.json()) as { items: Item[] };
  return data.items ?? [];
}

const getApiBase = () => import.meta.env?.VITE_API_URL || 'http://localhost:8787';

/** パートナー好感度取得（GET /api/partner/favorability） */
export async function getPartnerFavorability(): Promise<number> {
  const res = await fetch(`${getApiBase()}/api/partner/favorability`, { credentials: 'include' });
  if (!res.ok) throw new Error('好感度の取得に失敗しました');
  const data = (await res.json()) as { favorability: number };
  return data.favorability;
}

/** ペットに最後に渡したアイテムのレアリティ（GET /api/partner/last-pet-rarity） */
export async function getLastPetRarity(): Promise<string | null> {
  const res = await fetch(`${getApiBase()}/api/partner/last-pet-rarity`, { credentials: 'include' });
  if (!res.ok) return null;
  const data = (await res.json()) as { lastPetRarity: string | null };
  return data.lastPetRarity ?? null;
}

/** アイテムをパートナーまたはペットに渡す（POST /api/partner/give-item）。記録のみで所持は消費しない。 */
export async function giveItemToPartnerOrPet(
  itemId: string,
  target: 'partner' | 'pet'
): Promise<{ favorability: number; lastPetRarity: string | null }> {
  const res = await fetch(`${getApiBase()}/api/partner/give-item`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ itemId, target }),
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err?.error ?? 'アイテムを渡せませんでした');
  }
  return res.json() as Promise<{ favorability: number; lastPetRarity: string | null }>;
}
