/**
 * Task 4.1: 所持アイテム一覧 API
 * GET /api/items - 認証済みユーザー本人の所持アイテムを取得時刻の降順で返す。
 */
import { Hono } from 'hono';
import type { Bindings, AuthUser } from '../types';
import { getAcquiredItems } from '../services/gacha';

type ItemsVariables = { user: AuthUser };

export const itemsRouter = new Hono<{
  Bindings: Bindings;
  Variables: ItemsVariables;
}>();

itemsRouter.get('/', async (c) => {
  const user = c.get('user');
  const items = await getAcquiredItems(c.env.DB, user.id);
  return c.json({ items });
});
