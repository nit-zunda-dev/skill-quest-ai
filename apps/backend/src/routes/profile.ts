/**
 * ユーザープロフィールルート
 * GET /api/profile - 現在のユーザー情報を返す
 * PATCH /api/profile - プロフィールを更新する
 * 認証ミドルウェア適用後にマウントすること
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/d1';
import type { Bindings, AuthUser } from '../types';
import { schema } from '../db/schema';

type ProfileVariables = { user: AuthUser };

const updateProfileSchema = z.object({
  name: z.string().min(1).max(256).optional(),
  image: z.string().url().nullable().optional(),
});

export const profileRouter = new Hono<{
  Bindings: Bindings;
  Variables: ProfileVariables;
}>();

profileRouter.get('/', (c) => {
  const user = c.get('user');
  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image ?? null,
  });
});

profileRouter.patch(
  '/',
  zValidator('json', updateProfileSchema),
  async (c) => {
    const user = c.get('user');
    const data = c.req.valid('json');
    const db = drizzle(c.env.DB, { schema });

    const updateData: { name?: string; image?: string | null; updatedAt?: Date } = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.image !== undefined) updateData.image = data.image;
    if (Object.keys(updateData).length === 0) {
      return c.json({
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image ?? null,
      });
    }
    updateData.updatedAt = new Date();

    await db.update(schema.user).set(updateData).where(eq(schema.user.id, user.id));

    const rows = await db
      .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email, image: schema.user.image })
      .from(schema.user)
      .where(eq(schema.user.id, user.id))
      .limit(1);
    const updated = rows[0];
    if (!updated) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json({
      id: updated.id,
      email: updated.email,
      name: updated.name,
      image: updated.image ?? null,
    });
  }
);
