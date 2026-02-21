import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from '@skill-quest/shared';
import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import type { Bindings } from '../types';
import type { AuthUser } from '../types';
import { schema } from '../db/schema';
import {
  createQuestSchema,
  createQuestBatchSchema,
  updateQuestSchema,
  updateQuestStatusSchema,
  type CreateQuestRequest,
  type CreateQuestBatchRequest,
  type UpdateQuestRequest,
  type UpdateQuestStatusRequest,
} from '@skill-quest/shared';
import { Difficulty, TaskType } from '@skill-quest/shared';
import { HTTPException } from 'hono/http-exception';

const DIFFICULTY_TO_NUM: Record<Difficulty, number> = {
  [Difficulty.EASY]: 1,
  [Difficulty.MEDIUM]: 2,
  [Difficulty.HARD]: 3,
};

const NUM_TO_DIFFICULTY: Record<number, Difficulty> = {
  1: Difficulty.EASY,
  2: Difficulty.MEDIUM,
  3: Difficulty.HARD,
};

const idParamSchema = z.object({
  id: z.string().min(1, 'IDは必須です'),
});

type QuestVariables = { user: AuthUser };

/**
 * クエスト管理ルート
 * GET, POST, PUT, DELETE, PATCH /:id/complete /api/quests
 * 認証ミドルウェア適用後にマウントすること
 */
export const questsRouter = new Hono<{
  Bindings: Bindings;
  Variables: QuestVariables;
}>();

questsRouter.get('/', async (c) => {
  const user = c.get('user');
  const db = drizzle(c.env.DB, { schema });
  const rows = await db
    .select()
    .from(schema.quests)
    .where(eq(schema.quests.userId, user.id))
    .orderBy(schema.quests.createdAt);
  const body = rows.map((row) => toQuestResponse(row));
  return c.json(body);
});

questsRouter.post(
  '/',
  zValidator('json', createQuestSchema),
  async (c) => {
    const user = c.get('user');
    const db = drizzle(c.env.DB, { schema });
    const data = c.req.valid('json') as CreateQuestRequest;
    const id = crypto.randomUUID();
    const now = new Date();
    const difficultyNum = DIFFICULTY_TO_NUM[data.difficulty];
    const winCondition = data.winCondition
      ? { ...data.winCondition, type: data.type }
      : { type: data.type };

    await db.insert(schema.quests).values({
      id,
      userId: user.id,
      skillId: data.skillId ?? null,
      title: data.title,
      scenario: data.scenario ?? null,
      difficulty: difficultyNum,
      winCondition: winCondition as Record<string, unknown>,
      status: 'todo',
      createdAt: now,
      updatedAt: now,
    });

    const rows = await db.select().from(schema.quests).where(eq(schema.quests.id, id)).limit(1);
    const row = rows[0];
    if (row) return c.json(toQuestResponse(row), 201);
    return c.json(
      {
        id,
        title: data.title,
        type: data.type,
        difficulty: data.difficulty,
        completed: false,
        skillId: data.skillId,
        scenario: data.scenario,
        winCondition: data.winCondition ? { ...data.winCondition, type: data.type } : undefined,
      },
      201
    );
  }
);

questsRouter.post(
  '/batch',
  zValidator('json', createQuestBatchSchema),
  async (c) => {
    const user = c.get('user');
    const db = drizzle(c.env.DB, { schema });
    const { quests: questsData } = c.req.valid('json') as CreateQuestBatchRequest;
    const now = new Date();
    const created: typeof schema.quests.$inferSelect[] = [];

    for (const data of questsData) {
      const id = crypto.randomUUID();
      const difficultyNum = DIFFICULTY_TO_NUM[data.difficulty];
      const winCondition = data.winCondition
        ? { ...data.winCondition, type: data.type }
        : { type: data.type };

      await db.insert(schema.quests).values({
        id,
        userId: user.id,
        skillId: data.skillId ?? null,
        title: data.title,
        scenario: data.scenario ?? null,
        difficulty: difficultyNum,
        winCondition: winCondition as Record<string, unknown>,
        status: 'todo',
        createdAt: now,
        updatedAt: now,
      });

      const rows = await db.select().from(schema.quests).where(eq(schema.quests.id, id)).limit(1);
      const row = rows[0];
      if (row) created.push(row);
    }

    const body = created.map((row) => toQuestResponse(row));
    return c.json(body, 201);
  }
);

questsRouter.put(
  '/:id',
  zValidator('param', idParamSchema),
  zValidator('json', updateQuestSchema),
  async (c) => {
    const user = c.get('user');
    const db = drizzle(c.env.DB, { schema });
    const { id } = c.req.valid('param');
    const data = c.req.valid('json') as UpdateQuestRequest;

    const existingRows = await db
      .select()
      .from(schema.quests)
      .where(and(eq(schema.quests.id, id), eq(schema.quests.userId, user.id)))
      .limit(1);
    const existing = existingRows[0];
    if (!existing) throw new HTTPException(404, { message: 'Quest not found' });

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (data.title !== undefined) updates.title = data.title;
    if (data.scenario !== undefined) updates.scenario = data.scenario;
    if (data.difficulty !== undefined) updates.difficulty = DIFFICULTY_TO_NUM[data.difficulty];
    if (data.winCondition !== undefined) {
      const wc = { ...(existing.winCondition as Record<string, unknown>) ?? {}, ...data.winCondition };
      if (data.type !== undefined) wc.type = data.type;
      updates.winCondition = wc;
    } else if (data.type !== undefined) {
      const wc = { ...((existing.winCondition as Record<string, unknown>) ?? {}), type: data.type };
      updates.winCondition = wc;
    }

    await db.update(schema.quests).set(updates as Record<string, unknown>).where(eq(schema.quests.id, id));

    const updatedRows = await db.select().from(schema.quests).where(eq(schema.quests.id, id)).limit(1);
    const row = updatedRows[0];
    if (!row) throw new HTTPException(500, { message: 'Failed to update quest' });
    return c.json(toQuestResponse(row));
  }
);

questsRouter.delete(
  '/:id',
  zValidator('param', idParamSchema),
  async (c) => {
    const user = c.get('user');
    const db = drizzle(c.env.DB, { schema });
    const { id } = c.req.valid('param');

    const existingRows = await db
      .select()
      .from(schema.quests)
      .where(and(eq(schema.quests.id, id), eq(schema.quests.userId, user.id)))
      .limit(1);
    const existing = existingRows[0];
    if (!existing) throw new HTTPException(404, { message: 'Quest not found' });

    await db.delete(schema.quests).where(eq(schema.quests.id, id));
    return c.body(null, 204);
  }
);

questsRouter.patch(
  '/:id/complete',
  zValidator('param', idParamSchema),
  async (c) => {
    const user = c.get('user');
    const db = drizzle(c.env.DB, { schema });
    const { id } = c.req.valid('param');

    const existingRows = await db
      .select()
      .from(schema.quests)
      .where(and(eq(schema.quests.id, id), eq(schema.quests.userId, user.id)))
      .limit(1);
    const existing = existingRows[0];
    if (!existing) throw new HTTPException(404, { message: 'Quest not found' });

    const now = new Date();
    await db
      .update(schema.quests)
      .set({ completedAt: now, updatedAt: now })
      .where(eq(schema.quests.id, id));

    const updatedRows = await db.select().from(schema.quests).where(eq(schema.quests.id, id)).limit(1);
    const row = updatedRows[0];
    if (!row) throw new HTTPException(500, { message: 'Failed to update quest' });
    return c.json(toQuestResponse(row));
  }
);

questsRouter.patch(
  '/:id/status',
  zValidator('param', idParamSchema),
  zValidator('json', updateQuestStatusSchema),
  async (c) => {
    const user = c.get('user');
    const db = drizzle(c.env.DB, { schema });
    const { id } = c.req.valid('param');
    const { status } = c.req.valid('json') as UpdateQuestStatusRequest;

    const existingRows = await db
      .select()
      .from(schema.quests)
      .where(and(eq(schema.quests.id, id), eq(schema.quests.userId, user.id)))
      .limit(1);
    const existing = existingRows[0];
    if (!existing) throw new HTTPException(404, { message: 'Quest not found' });

    const now = new Date();
    const updates: Record<string, unknown> = { status, updatedAt: now };
    
    // statusが'done'の場合はcompletedAtも設定、それ以外はnullに
    if (status === 'done') {
      updates.completedAt = now;
    } else if (existing.completedAt != null) {
      // 'done'以外に戻す場合はcompletedAtをクリア
      updates.completedAt = null;
    }

    await db
      .update(schema.quests)
      .set(updates)
      .where(eq(schema.quests.id, id));

    const updatedRows = await db.select().from(schema.quests).where(eq(schema.quests.id, id)).limit(1);
    const row = updatedRows[0];
    if (!row) throw new HTTPException(500, { message: 'Failed to update quest status' });
    return c.json(toQuestResponse(row));
  }
);

function toQuestResponse(row: typeof schema.quests.$inferSelect) {
  const winCondition = (row.winCondition as Record<string, unknown> | null) ?? {};
  const type = (winCondition.type as TaskType) ?? TaskType.TODO;
  const difficulty =
    NUM_TO_DIFFICULTY[row.difficulty] ?? Difficulty.MEDIUM;
  
  // statusが設定されていない場合は、completedAtから推論
  let status: 'todo' | 'in_progress' | 'done' = 'todo';
  if (row.status) {
    status = row.status as 'todo' | 'in_progress' | 'done';
  } else if (row.completedAt != null) {
    status = 'done';
  }
  
  return {
    id: row.id,
    title: row.title,
    type,
    difficulty,
    completed: row.completedAt != null,
    status,
    completedAt: row.completedAt ?? undefined,
    skillId: row.skillId ?? undefined,
    scenario: row.scenario ?? undefined,
    winCondition: Object.keys(winCondition).length ? winCondition : undefined,
  };
}
