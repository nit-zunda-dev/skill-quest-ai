import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Bindings } from '../types';
import {
  genesisFormDataSchema,
  narrativeRequestSchema,
  partnerMessageRequestSchema,
} from '@skill-quest/shared';
import type { CharacterProfile } from '@skill-quest/shared';

type NarrativeResult = { narrative: string; rewardXp: number; rewardGold: number };

/**
 * AI生成ルート
 * - POST /generate-character
 * - POST /generate-narrative
 * - POST /generate-partner-message
 * Workers AI はタスク7で統合。ここではスタブで応答する。
 */
export const aiRouter = new Hono<{ Bindings: Bindings }>();

function stubCharacterProfile(name: string, goal: string): CharacterProfile {
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

function stubNarrativeResult(): NarrativeResult {
  return {
    narrative: 'クエストを達成した。',
    rewardXp: 10,
    rewardGold: 5,
  };
}

aiRouter.post(
  '/generate-character',
  zValidator('json', genesisFormDataSchema),
  async (c) => {
    const data = c.req.valid('json');
    const profile = stubCharacterProfile(data.name, data.goal);
    return c.json(profile);
  }
);

aiRouter.post(
  '/generate-narrative',
  zValidator('json', narrativeRequestSchema),
  async (c) => {
    const result = stubNarrativeResult();
    return c.json(result);
  }
);

aiRouter.post(
  '/generate-partner-message',
  zValidator('json', partnerMessageRequestSchema),
  async (c) => {
    const result = { message: '一緒に頑張ろう。' };
    return c.json(result);
  }
);
