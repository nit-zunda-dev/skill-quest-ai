import { Hono } from 'hono';
import type { Bindings, AuthUser } from '../types';
import { getGrimoireEntries } from '../services/ai-usage';

type GrimoireVariables = { user: AuthUser };

/**
 * グリモワールルート
 * GET /api/grimoire - 認証ユーザーのグリモワール一覧を返す
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
