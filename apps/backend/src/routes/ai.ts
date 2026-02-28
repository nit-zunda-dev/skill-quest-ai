import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { streamText } from 'hono/streaming';
import type { Bindings, AuthUser } from '../types';
import {
  genesisFormDataSchema,
  narrativeRequestSchema,
  partnerMessageRequestSchema,
  chatRequestSchema,
  suggestQuestsRequestSchema,
  updateGoalRequestSchema,
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
  completeQuest,
  getTodayUtc,
  CHAT_DAILY_LIMIT,
  createGrimoireEntry,
} from '../services/ai-usage';
import { grantItemOnQuestComplete } from '../services/gacha';
import {
  getFavorabilityDeltaFromMessage,
  addFavorability,
} from '../services/partner-favorability';

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
  const grimoireRemaining = Math.max(0, 1 - usage.grimoireCount);
  return c.json({
    characterGenerated,
    narrativeRemaining,
    partnerRemaining,
    chatRemaining,
    grimoireRemaining,
    limits: { narrative: 1, partner: 1, chat: CHAT_DAILY_LIMIT, grimoire: 1 },
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
    const profileWithGoal = { ...profile, goal: sanitized.goal };
    await recordCharacterGenerated(c.env.DB, user.id);
    await saveCharacterProfile(c.env.DB, user.id, profileWithGoal);

    // プロローグを第一回のグリモワールとして保存
    if (profileWithGoal.prologue) {
      await createGrimoireEntry(c.env.DB, user.id, {
        taskTitle: 'プロローグ',
        narrative: profileWithGoal.prologue,
        rewardXp: 0,
        rewardGold: 0,
      });
    }

    return c.json(profileWithGoal);
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
    const profileRaw = await getCharacterProfile(c.env.DB, user.id);
    const service = createAiService(c.env);
    const result = await service.generateNarrative(sanitized);

    // プロフィール取得・XP/ゴールド加算・レベルアップ・永続化
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

      await updateCharacterProfile(c.env.DB, user.id, {
        currentXp: newXp,
        nextLevelXp: nextXp,
        level: newLevel,
        gold: newGold,
      });
      updatedProfile = { 
        ...p, 
        currentXp: newXp, 
        nextLevelXp: nextXp, 
        level: newLevel, 
        gold: newGold,
      };
    }

    // クエスト完了マーク
    await completeQuest(c.env.DB, user.id, data.taskId);
    const { item: grantedItem } = await grantItemOnQuestComplete(c.env.DB, user.id, data.taskId);

    await recordNarrative(c.env.DB, user.id, today);

    return c.json({
      narrative: result.narrative,
      rewardXp: result.rewardXp,
      rewardGold: result.rewardGold,
      profile: updatedProfile ?? undefined,
      questCompletedAt: Date.now(),
      grantedItem: grantedItem ?? null,
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
  '/suggest-quests',
  zValidator('json', suggestQuestsRequestSchema),
  async (c) => {
    const user = c.get('user');
    const data = c.req.valid('json');
    const goalResult = prepareUserPrompt(data.goal);
    if (!goalResult.ok) {
      return c.json({ error: 'Invalid or unsafe input', reason: goalResult.reason }, 400);
    }
    const goal = goalResult.sanitized;

    try {
      const service = createAiService(c.env);
      const suggestions = await service.generateSuggestedQuests(goal);
      if (suggestions.length === 0) {
        return c.json(
          { error: 'AI generation failed', message: 'AIが有効な提案を生成できませんでした。しばらく経ってから再試行してください。' },
          503
        );
      }
      return c.json({ suggestions }, 200);
    } catch (err) {
      console.error('[suggest-quests] AI service error:', err);
      return c.json(
        { error: 'AI service unavailable', message: 'AIサービスに接続できませんでした。しばらく経ってから再試行してください。' },
        502
      );
    }
  }
);

/** 目標更新（1日2回まで。更新時にクエスト全削除） */
aiRouter.patch(
  '/goal',
  zValidator('json', updateGoalRequestSchema),
  async (c) => {
    const user = c.get('user');
    const data = c.req.valid('json');
    const goalResult = prepareUserPrompt(data.goal);
    if (!goalResult.ok) {
      return c.json({ error: 'Invalid or unsafe input', reason: goalResult.reason }, 400);
    }
    const goal = goalResult.sanitized;

    const today = getTodayUtc();
    const usage = await getDailyUsage(c.env.DB, user.id, today);
    if (usage.goalUpdateCount >= 2) {
      return c.json(
        { error: 'Too Many Requests', message: '本日は目標の変更回数（2回）に達しています。' },
        429
      );
    }

    const profile = await getCharacterProfile(c.env.DB, user.id);
    if (profile == null || typeof profile !== 'object') {
      return c.json({ error: 'Profile not found', message: 'キャラクターが生成されていません。' }, 404);
    }

    const merged = { ...(profile as Record<string, unknown>), goal };
    const updateStmt = c.env.DB.prepare(
      'UPDATE user_character_profile SET profile = ? WHERE user_id = ?'
    ).bind(JSON.stringify(merged), user.id);
    const deleteStmt = c.env.DB.prepare('DELETE FROM quests WHERE user_id = ?').bind(user.id);
    const recordStmt = c.env.DB.prepare(
      `INSERT INTO ai_daily_usage (user_id, date_utc, narrative_count, partner_count, chat_count, grimoire_count, goal_update_count)
       VALUES (?, ?, 0, 0, 0, 0, 1)
       ON CONFLICT(user_id, date_utc) DO UPDATE SET goal_update_count = goal_update_count + 1`
    ).bind(user.id, today);

    try {
      await c.env.DB.batch([updateStmt, deleteStmt, recordStmt]);
      return c.json({ ok: true }, 200);
    } catch {
      return c.json(
        { error: 'Internal Server Error', message: '目標の更新に失敗しました。しばらく経ってから再試行してください。' },
        500
      );
    }
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

    const systemMessage = [
      'あなたはサイバーパンク都市のバーで働くスタッフ（ウェイトレスまたはウェイター）です。',
      '冒険者（ユーザー）にとっての「相棒」であり、クエストの相談相手です。',
      '【性格・トーン】',
      '- 優しく親しみやすい。砕けた口調（です・ます調は使わない）。',
      '- 失敗しても責めない。「また挑戦しよう」と前向きに励ます。',
      '- クエストの相談、学習の悩み、雑談、何でも気軽に応じる。',
      '- バーの常連を迎えるように、安心感と応援の気持ちを込めて話す。',
    ].join('\n');
    const messages = [
      { role: 'system' as const, content: systemMessage },
      { role: 'user' as const, content: msgResult.sanitized }
    ];

    await recordChat(c.env.DB, user.id, today);

    const favorabilityDelta = getFavorabilityDeltaFromMessage(msgResult.sanitized);
    if (favorabilityDelta > 0) {
      await addFavorability(c.env.DB, user.id, favorabilityDelta);
    }

    return streamText(c, async (stream) => {
      try {
        const ai = c.env.AI as {
          run(
            model: string,
            options: Record<string, unknown>,
            gatewayOptions?: { gateway: { id: string } }
          ): Promise<AsyncIterable<unknown>>;
        };
        const options = {
          messages,
          stream: true,
        };
        const gatewayOptions = c.env.AI_GATEWAY_ID
          ? { gateway: { id: c.env.AI_GATEWAY_ID } }
          : undefined;
        const response = await ai.run(MODEL_LLAMA_31_8B, options, gatewayOptions);

        // Workers AI の stream:true は Uint8Array の AsyncIterable を返し、
        // 中身は SSE 形式 ("data: {\"response\":\"...\",\"p\":\"...\"}\n\n") のバイト列。
        // 1 つの SSE 行が複数チャンクに分割されるため、バッファリングして解析する。
        const decoder = new TextDecoder();
        let buffer = '';
        let hasContent = false;

        for await (const chunk of response) {
          // Uint8Array → 文字列にデコードしてバッファに追加
          if (chunk instanceof Uint8Array) {
            buffer += decoder.decode(chunk, { stream: true });
          } else if (chunk && typeof chunk === 'object') {
            // オブジェクトが直接来た場合（ローカルテストなど）
            const obj = chunk as Record<string, unknown>;
            if ('response' in obj && typeof obj.response === 'string' && obj.response) {
              hasContent = true;
              await stream.write(obj.response);
              continue;
            }
          }

          // バッファから完全な SSE 行を抽出して処理
          // SSE 形式: "data: {JSON}\n\n"
          let boundary: number;
          while ((boundary = buffer.indexOf('\n\n')) !== -1) {
            const rawLine = buffer.slice(0, boundary).trim();
            buffer = buffer.slice(boundary + 2);

            if (rawLine === 'data: [DONE]') continue;
            if (!rawLine.startsWith('data: ')) continue;

            try {
              const data = JSON.parse(rawLine.slice(6));
              if (data?.response && typeof data.response === 'string') {
                hasContent = true;
                await stream.write(data.response);
              }
            } catch {
              // 不完全な JSON は無視
            }
          }
        }

        // バッファに残ったデータを処理
        const remaining = buffer.trim();
        if (remaining.startsWith('data: ') && remaining !== 'data: [DONE]') {
          try {
            const data = JSON.parse(remaining.slice(6));
            if (data?.response && typeof data.response === 'string') {
              hasContent = true;
              await stream.write(data.response);
            }
          } catch {
            // 無視
          }
        }

        if (!hasContent) {
          await stream.write('申し訳ありません。応答を生成できませんでした。');
        }
      } catch (err) {
        console.error('[Chat Stream] Error:', err);
        await stream.write('申し訳ありません。一時的に応答を生成できませんでした。');
      } finally {
        await stream.close();
      }
    });
  }
);
