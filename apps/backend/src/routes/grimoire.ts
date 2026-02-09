import { Hono } from 'hono';
import { eq, and, isNotNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import type { Bindings, AuthUser } from '../types';
import { schema } from '../db/schema';
import { getGrimoireEntries, createGrimoireEntry, getDailyUsage, recordGrimoireGeneration, getTodayUtc, getCharacterProfile, updateCharacterProfile } from '../services/ai-usage';
import { createAiService } from '../services/ai';
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
  
  if (completedQuests.length === 0) {
    return c.json({ error: 'Bad Request', message: '完了したタスクがありません。' }, 400);
  }
  
  // 完了タスクをCompletedTask形式に変換
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
  
  // AIサービスでグリモワールを生成
  const service = createAiService(c.env);
  const result = await service.generateGrimoire(completedTasks);
  
  // プロフィール取得・XP/ゴールド加算・レベルアップ・永続化
  const profileRaw = await getCharacterProfile(c.env.DB, user.id);
  let updatedProfile = profileRaw as Record<string, unknown> | null;
  let oldProfile = profileRaw as Record<string, unknown> | null;
  
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
  
  // グリモワールエントリを作成
  const taskTitles = completedTasks.map(t => t.title).join('、');
  const grimoireResult = await createGrimoireEntry(c.env.DB, user.id, {
    taskTitle: `今日の冒険: ${taskTitles}`,
    narrative: result.narrative,
    rewardXp: result.rewardXp,
    rewardGold: result.rewardGold,
  });
  
  // 利用回数を記録
  await recordGrimoireGeneration(c.env.DB, user.id, today);
  
  const grimoireEntry = {
    id: grimoireResult.id,
    date: new Date().toLocaleDateString('ja-JP'),
    taskTitle: `今日の冒険: ${taskTitles}`,
    narrative: result.narrative,
    rewardXp: result.rewardXp,
    rewardGold: result.rewardGold,
  };
  
  return c.json({
    grimoireEntry,
    profile: updatedProfile ?? undefined,
    oldProfile: oldProfile ?? undefined,
  });
});
