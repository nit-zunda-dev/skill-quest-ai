/**
 * AI API クライアント
 * タスク 11.1: Gemini API を廃止し、バックエンド API（Workers AI）を呼び出す
 */
import { client } from './client';
import {
  Difficulty,
  type CharacterProfile,
  type GenesisFormData,
  type Task,
  type CharacterStats,
} from '@skill-quest/shared';

type HcClient = {
  api: {
    ai: {
      'generate-character': { $post: (opts: { json: GenesisFormData }) => Promise<Response> };
      'generate-narrative': { $post: (opts: { json: object }) => Promise<Response> };
      'generate-partner-message': { $post: (opts: { json: object }) => Promise<Response> };
    };
  };
};
const api = (client as HcClient).api;

interface NarrativeResult {
  narrative: string;
  xp: number;
  gold: number;
}

const FALLBACK_PROFILE = (name: string): CharacterProfile => ({
  name,
  className: '冒険者',
  title: '始まりの旅人',
  stats: {
    strength: 50,
    intelligence: 50,
    charisma: 50,
    willpower: 50,
    luck: 50,
  } satisfies CharacterStats,
  prologue: '新たな冒険の幕が開けます。',
  startingSkill: '挑戦の心',
  themeColor: '#6366f1',
  level: 1,
  currentXp: 0,
  nextLevelXp: 100,
  hp: 100,
  maxHp: 100,
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
    return (await res.json()) as NarrativeResult;
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
