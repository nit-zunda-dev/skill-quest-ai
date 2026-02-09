import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { streamText } from 'hono/streaming';
import type { Bindings, AuthUser } from '../types';
import {
  genesisFormDataSchema,
  narrativeRequestSchema,
  partnerMessageRequestSchema,
  chatRequestSchema,
} from '@skill-quest/shared';
import { createAiService, MODEL_LLAMA_31_8B } from '../services/ai';
import { prepareUserPrompt } from '../services/prompt-safety';
import {
  hasCharacterGenerated,
  recordCharacterGenerated,
  saveCharacterProfile,
  getCharacterProfile,
  updateCharacterProfile,
  getDailyUsage,
  recordNarrative,
  recordPartner,
  recordChat,
  createGrimoireEntry,
  getGrimoireEntries,
  completeQuest,
  getTodayUtc,
  CHAT_DAILY_LIMIT,
} from '../services/ai-usage';

type AiVariables = { user: AuthUser };

/**
 * AI生成ルート（認証必須・利用制限ポリシー適用）
 * - POST /generate-character … 1回限り
 * - POST /generate-narrative … 1日1回
 * - POST /generate-partner-message … 1日1回
 * - POST /chat … 1日N回（例: 10回）
 */
export const aiRouter = new Hono<{ Bindings: Bindings; Variables: AiVariables }>();

const limitExceeded = (c: { json: (body: unknown, status: number) => Response }, message: string) =>
  c.json({ error: 'Too Many Requests', message }, 429);

/** AI利用残り回数・制限情報（タスク 9.3） */
aiRouter.get('/usage', async (c) => {
  const user = c.get('user');
  const today = getTodayUtc();
  const [characterGenerated, usage] = await Promise.all([
    hasCharacterGenerated(c.env.DB, user.id),
    getDailyUsage(c.env.DB, user.id, today),
  ]);
  const narrativeRemaining = Math.max(0, 1 - usage.narrativeCount);
  const partnerRemaining = Math.max(0, 1 - usage.partnerCount);
  const chatRemaining = Math.max(0, CHAT_DAILY_LIMIT - usage.chatCount);
  return c.json({
    characterGenerated,
    narrativeRemaining,
    partnerRemaining,
    chatRemaining,
    limits: { narrative: 1, partner: 1, chat: CHAT_DAILY_LIMIT },
  });
});

/** 保存済みキャラクタープロフィール取得（ログイン時ダッシュボード表示用） */
aiRouter.get('/character', async (c) => {
  const user = c.get('user');
  const profile = await getCharacterProfile(c.env.DB, user.id);
  if (profile == null) {
    return c.json({ error: 'Character not generated' }, 404);
  }
  return c.json(profile);
});

aiRouter.post(
  '/generate-character',
  zValidator('json', genesisFormDataSchema),
  async (c) => {
    const user = c.get('user');
    const already = await hasCharacterGenerated(c.env.DB, user.id);
    if (already) return limitExceeded(c, 'キャラクターは1アカウント1回までです。');

    const data = c.req.valid('json');
    const nameResult = prepareUserPrompt(data.name);
    if (!nameResult.ok) return c.json({ error: 'Invalid or unsafe input', reason: nameResult.reason }, 400);
    const goalResult = prepareUserPrompt(data.goal);
    if (!goalResult.ok) return c.json({ error: 'Invalid or unsafe input', reason: goalResult.reason }, 400);
    const sanitized = { ...data, name: nameResult.sanitized, goal: goalResult.sanitized };
    const service = createAiService(c.env);
    const profile = await service.generateCharacter(sanitized);
    await recordCharacterGenerated(c.env.DB, user.id);
    await saveCharacterProfile(c.env.DB, user.id, profile);
    return c.json(profile);
  }
);

aiRouter.post(
  '/generate-narrative',
  zValidator('json', narrativeRequestSchema),
  async (c) => {
    const user = c.get('user');
    const today = getTodayUtc();
    const usage = await getDailyUsage(c.env.DB, user.id, today);
    if (usage.narrativeCount >= 1) return limitExceeded(c, 'ナラティブ生成は1日1回までです。');

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

    // プロフィール取得・XP/ゴールド加算・レベルアップ・永続化
    const profileRaw = await getCharacterProfile(c.env.DB, user.id);
    let updatedProfile = profileRaw as Record<string, unknown> | null;
    if (profileRaw && typeof profileRaw === 'object') {
      const p = profileRaw as Record<string, unknown>;
      let newXp = (Number(p.currentXp) || 0) + result.rewardXp;
      let newLevel = Number(p.level) || 1;
      let nextXp = Number(p.nextLevelXp) || 100;
      const newGold = (Number(p.gold) || 0) + result.rewardGold;

      while (newXp >= nextXp) {
        newXp -= nextXp;
        newLevel += 1;
        nextXp = Math.floor(nextXp * 1.2);
      }

      // HPの更新（0以上maxHp以下に制限）
      const maxHp = Number(p.maxHp) || 100;
      const currentHp = Number(p.hp) || maxHp;
      const rewardHp = result.rewardHp ?? 0;
      const newHp = Math.max(0, Math.min(maxHp, currentHp + rewardHp));

      // 能力値の更新（0以上100以下に制限）
      const currentStats = (p.stats as Record<string, unknown>) || {};
      const rewardStats = result.rewardStats || {};
      const newStats: Record<string, number> = {};
      const statKeys = ['strength', 'intelligence', 'charisma', 'willpower', 'luck'] as const;
      for (const key of statKeys) {
        const current = Number(currentStats[key]) || 50;
        const reward = Number(rewardStats[key]) || 0;
        newStats[key] = Math.max(0, Math.min(100, current + reward));
      }

      await updateCharacterProfile(c.env.DB, user.id, {
        currentXp: newXp,
        nextLevelXp: nextXp,
        level: newLevel,
        gold: newGold,
        hp: newHp,
        stats: newStats,
      });
      updatedProfile = { 
        ...p, 
        currentXp: newXp, 
        nextLevelXp: nextXp, 
        level: newLevel, 
        gold: newGold,
        hp: newHp,
        stats: newStats,
      };
    }

    // クエスト完了マーク
    await completeQuest(c.env.DB, user.id, data.taskId);

    // グリモワールに記録
    const grimoireResult = await createGrimoireEntry(c.env.DB, user.id, {
      taskTitle: sanitized.taskTitle,
      narrative: result.narrative,
      rewardXp: result.rewardXp,
      rewardGold: result.rewardGold,
    });

    await recordNarrative(c.env.DB, user.id, today);

    const grimoireEntry = {
      id: grimoireResult.id,
      date: new Date().toLocaleDateString('ja-JP'),
      taskTitle: sanitized.taskTitle,
      narrative: result.narrative,
      rewardXp: result.rewardXp,
      rewardGold: result.rewardGold,
    };

    return c.json({
      narrative: result.narrative,
      rewardXp: result.rewardXp,
      rewardGold: result.rewardGold,
      rewardHp: result.rewardHp ?? 0,
      rewardStats: result.rewardStats ?? {},
      profile: updatedProfile ?? undefined,
      grimoireEntry,
      questCompletedAt: Date.now(),
    });
  }
);

aiRouter.post(
  '/generate-partner-message',
  zValidator('json', partnerMessageRequestSchema),
  async (c) => {
    const user = c.get('user');
    const today = getTodayUtc();
    const usage = await getDailyUsage(c.env.DB, user.id, today);
    if (usage.partnerCount >= 1) return limitExceeded(c, 'パートナーメッセージは1日1回までです。');

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
    await recordPartner(c.env.DB, user.id, today);
    return c.json({ message });
  }
);

aiRouter.post(
  '/chat',
  zValidator('json', chatRequestSchema),
  async (c) => {
    const user = c.get('user');
    const today = getTodayUtc();
    const usage = await getDailyUsage(c.env.DB, user.id, today);
    if (usage.chatCount >= CHAT_DAILY_LIMIT) return limitExceeded(c, `チャットは1日${CHAT_DAILY_LIMIT}回までです。`);

    const data = c.req.valid('json');
    const msgResult = prepareUserPrompt(data.message);
    if (!msgResult.ok) return c.json({ error: 'Invalid or unsafe input', reason: msgResult.reason }, 400);
    const messages = [{ role: 'user' as const, content: msgResult.sanitized }];

    await recordChat(c.env.DB, user.id, today);

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
