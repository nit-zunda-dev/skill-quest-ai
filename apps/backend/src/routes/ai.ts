import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Bindings } from '../types';
import {
  genesisFormDataSchema,
  narrativeRequestSchema,
  partnerMessageRequestSchema,
} from '@skill-quest/shared';
import { createAiService } from '../services/ai';

type NarrativeResult = { narrative: string; rewardXp: number; rewardGold: number };

/**
 * AI生成ルート
 * - POST /generate-character … Workers AI (Llama 3.1 8B) でキャラクター生成
 * - POST /generate-narrative … スタブ（タスク7.3で実装）
 * - POST /generate-partner-message … スタブ（タスク7.4で実装）
 */
export const aiRouter = new Hono<{ Bindings: Bindings }>();

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
    const service = createAiService(c.env);
    const profile = await service.generateCharacter(data);
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
