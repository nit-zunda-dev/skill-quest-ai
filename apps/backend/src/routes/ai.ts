import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import type { Bindings } from '../types';
import {
  genesisFormDataSchema,
  narrativeRequestSchema,
  partnerMessageRequestSchema,
} from '@skill-quest/shared';
import { createAiService } from '../services/ai';

/**
 * AI生成ルート
 * - POST /generate-character … Workers AI (Llama 3.1 8B) でキャラクター生成
 * - POST /generate-narrative … Workers AI (Llama 3.1 8B) でナラティブ・報酬生成
 * - POST /generate-partner-message … Workers AI (Llama 3.1 8B) でパートナーセリフ生成
 */
export const aiRouter = new Hono<{ Bindings: Bindings }>();

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
    const data = c.req.valid('json');
    const service = createAiService(c.env);
    const result = await service.generateNarrative(data);
    return c.json(result);
  }
);

aiRouter.post(
  '/generate-partner-message',
  zValidator('json', partnerMessageRequestSchema),
  async (c) => {
    const data = c.req.valid('json');
    const service = createAiService(c.env);
    const message = await service.generatePartnerMessage(data);
    return c.json({ message });
  }
);
