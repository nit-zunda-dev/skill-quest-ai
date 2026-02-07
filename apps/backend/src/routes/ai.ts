import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { streamText } from 'hono/streaming';
import type { Bindings } from '../types';
import {
  genesisFormDataSchema,
  narrativeRequestSchema,
  partnerMessageRequestSchema,
  chatRequestSchema,
} from '@skill-quest/shared';
import { createAiService, MODEL_LLAMA_31_8B } from '../services/ai';
import { prepareUserPrompt } from '../services/prompt-safety';

/**
 * AI生成ルート
 * - POST /generate-character … Workers AI (Llama 3.1 8B) でキャラクター生成
 * - POST /generate-narrative … Workers AI (Llama 3.1 8B) でナラティブ・報酬生成
 * - POST /generate-partner-message … Workers AI (Llama 3.1 8B) でパートナーセリフ生成
 * - POST /chat … ストリーミングチャット (Llama 3.1 8B)
 */
export const aiRouter = new Hono<{ Bindings: Bindings }>();

aiRouter.post(
  '/generate-character',
  zValidator('json', genesisFormDataSchema),
  async (c) => {
    const data = c.req.valid('json');
    const nameResult = prepareUserPrompt(data.name);
    if (!nameResult.ok) return c.json({ error: 'Invalid or unsafe input', reason: nameResult.reason }, 400);
    const goalResult = prepareUserPrompt(data.goal);
    if (!goalResult.ok) return c.json({ error: 'Invalid or unsafe input', reason: goalResult.reason }, 400);
    const sanitized = { ...data, name: nameResult.sanitized, goal: goalResult.sanitized };
    const service = createAiService(c.env);
    const profile = await service.generateCharacter(sanitized);
    return c.json(profile);
  }
);

aiRouter.post(
  '/generate-narrative',
  zValidator('json', narrativeRequestSchema),
  async (c) => {
    const data = c.req.valid('json');
    const titleResult = prepareUserPrompt(data.taskTitle);
    if (!titleResult.ok) return c.json({ error: 'Invalid or unsafe input', reason: titleResult.reason }, 400);
    const sanitized = { ...data, taskTitle: titleResult.sanitized };
    if (sanitized.userComment != null && sanitized.userComment !== '') {
      const commentResult = prepareUserPrompt(sanitized.userComment);
      if (!commentResult.ok) return c.json({ error: 'Invalid or unsafe input', reason: commentResult.reason }, 400);
      sanitized.userComment = commentResult.sanitized;
    }
    const service = createAiService(c.env);
    const result = await service.generateNarrative(sanitized);
    return c.json(result);
  }
);

aiRouter.post(
  '/generate-partner-message',
  zValidator('json', partnerMessageRequestSchema),
  async (c) => {
    const data = c.req.valid('json');
    const sanitized = { ...data };
    for (const key of ['progressSummary', 'timeOfDay', 'currentTaskTitle'] as const) {
      const v = sanitized[key];
      if (v != null && v !== '') {
        const result = prepareUserPrompt(v);
        if (!result.ok) return c.json({ error: 'Invalid or unsafe input', reason: result.reason }, 400);
        sanitized[key] = result.sanitized;
      }
    }
    const service = createAiService(c.env);
    const message = await service.generatePartnerMessage(sanitized);
    return c.json({ message });
  }
);

aiRouter.post(
  '/chat',
  zValidator('json', chatRequestSchema),
  async (c) => {
    const data = c.req.valid('json');
    const msgResult = prepareUserPrompt(data.message);
    if (!msgResult.ok) return c.json({ error: 'Invalid or unsafe input', reason: msgResult.reason }, 400);
    const messages = [{ role: 'user' as const, content: msgResult.sanitized }];
    return streamText(c, async (stream) => {
      try {
        const ai = c.env.AI as {
          run(model: string, options: Record<string, unknown>): Promise<AsyncIterable<{ response?: string }>>;
        };
        const response = await ai.run(MODEL_LLAMA_31_8B, {
          messages,
          stream: true,
        });
        const iterable = response;
        for await (const chunk of iterable) {
          if (chunk?.response) {
            await stream.write(chunk.response);
          }
        }
      } catch (err) {
        console.error('Chat stream error:', err);
        await stream.write('申し訳ありません。一時的に応答を生成できませんでした。');
      } finally {
        await stream.close();
      }
    });
  }
);
