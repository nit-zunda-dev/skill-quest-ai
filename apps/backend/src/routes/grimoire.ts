import { Hono } from 'hono';
import { eq, and, isNotNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import type { Bindings, AuthUser } from '../types';
import { schema } from '../db/schema';
import { getGrimoireEntries, createGrimoireEntry, getDailyUsage, recordGrimoireGeneration, getTodayUtc, getCharacterProfile, updateCharacterProfile } from '../services/ai-usage';
import { createAiService, getGrimoireFallbackTitleAndRewards, buildGrimoireNarrativeFromTemplate, type GrimoireContext } from '../services/ai';
import { Difficulty, TaskType } from '@skill-quest/shared';

type GrimoireVariables = { user: AuthUser };

const NUM_TO_DIFFICULTY: Record<number, Difficulty> = {
  1: Difficulty.EASY,
  2: Difficulty.MEDIUM,
  3: Difficulty.HARD,
};

/**
 * グリモワールルート
 * GET /api/grimoire - 認証ユーザーのグリモワール一覧を返す
 * POST /api/grimoire/generate - 完了タスクすべてを参考にグリモワールを生成（1日1回）
 */
export const grimoireRouter = new Hono<{
  Bindings: Bindings;
  Variables: GrimoireVariables;
}>();

grimoireRouter.get('/', async (c) => {
  const user = c.get('user');
  const entries = await getGrimoireEntries(c.env.DB, user.id);
  const body = entries.map((e) => ({
    id: e.id,
    date: new Date(e.createdAt * 1000).toLocaleDateString('ja-JP'),
    taskTitle: e.taskTitle,
    narrative: e.narrative,
    rewardXp: e.rewardXp,
    rewardGold: e.rewardGold,
  }));
  return c.json(body);
});

grimoireRouter.post('/generate', async (c) => {
  const user = c.get('user');
  const today = getTodayUtc();
  const usage = await getDailyUsage(c.env.DB, user.id, today);
  
  // 日次制限チェック（1日1回）
  if (usage.grimoireCount >= 1) {
    return c.json({ error: 'Too Many Requests', message: 'グリモワール生成は1日1回までです。' }, 429);
  }

  const profileRaw = await getCharacterProfile(c.env.DB, user.id);
  const characterName = (profileRaw && typeof profileRaw === 'object' && typeof (profileRaw as Record<string, unknown>).name === 'string')
    ? String((profileRaw as Record<string, unknown>).name)
    : '冒険者';

  // 完了したタスクをすべて取得
  const db = drizzle(c.env.DB, { schema });
  const completedQuests = await db
    .select()
    .from(schema.quests)
    .where(and(
      eq(schema.quests.userId, user.id),
      isNotNull(schema.quests.completedAt)
    ))
    .orderBy(schema.quests.completedAt);

  // 完了タスクをCompletedTask形式に変換（0件でも配列のまま）
  const completedTasks = completedQuests.map((q) => {
    const winCondition = (q.winCondition as Record<string, unknown> | null) ?? {};
    const type = (winCondition.type as TaskType) ?? TaskType.TODO;
    const difficulty = NUM_TO_DIFFICULTY[q.difficulty] ?? Difficulty.MEDIUM;

    return {
      id: q.id,
      title: q.title,
      type: type,
      difficulty: difficulty,
      completedAt: q.completedAt ? Math.floor(new Date(q.completedAt).getTime() / 1000) : 0,
    };
  });

  let result: { title: string; rewardXp: number; rewardGold: number };
  let isFallbackStub = false;

  if (completedTasks.length === 0) {
    // 0件: AIは呼ばずフォールバックでタイトル・報酬0・0件用ナラティブ
    result = getGrimoireFallbackTitleAndRewards([], characterName);
  } else {
    // 過去のグリモワールエントリを取得（タイトル生成のコンテキスト用）
    const previousEntries = await getGrimoireEntries(c.env.DB, user.id);
    const previousNarratives = previousEntries.slice(0, 3).map((e) => e.narrative);

    let grimoireContext: GrimoireContext | undefined;
    if (profileRaw && typeof profileRaw === 'object') {
      const p = profileRaw as Record<string, unknown>;
      grimoireContext = {
        characterName: String(p.name ?? '冒険者'),
        className: String(p.className ?? '冒険者'),
        title: String(p.title ?? '見習い'),
        level: Number(p.level) || 1,
        goal: String(p.goal ?? ''),
        previousNarratives,
      };
    }

    const createResult = await createAiService(c.env, { db: c.env.DB, getTodayUtc });
    isFallbackStub = createResult.isFallbackStub;
    result = await createResult.service.generateGrimoire(completedTasks, grimoireContext);
  }

  const narrative = buildGrimoireNarrativeFromTemplate(completedTasks, characterName, result.rewardXp, result.rewardGold);

  // プロフィール更新（報酬が0の場合はXP/レベルを変えない）
  let updatedProfile = profileRaw as Record<string, unknown> | null;
  const oldProfile = profileRaw as Record<string, unknown> | null;

  if ((result.rewardXp > 0 || result.rewardGold > 0) && profileRaw && typeof profileRaw === 'object') {
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

  const grimoireResult = await createGrimoireEntry(c.env.DB, user.id, {
    taskTitle: result.title,
    narrative,
    rewardXp: result.rewardXp,
    rewardGold: result.rewardGold,
  });

  if (!isFallbackStub) await recordGrimoireGeneration(c.env.DB, user.id, today);

  const grimoireEntry = {
    id: grimoireResult.id,
    date: new Date().toLocaleDateString('ja-JP'),
    taskTitle: result.title,
    narrative,
    rewardXp: result.rewardXp,
    rewardGold: result.rewardGold,
  };

  return c.json({
    grimoireEntry,
    profile: updatedProfile ?? undefined,
    oldProfile: oldProfile ?? undefined,
  });
});
