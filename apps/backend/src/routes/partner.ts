/**
 * パートナー（バー）関連API
 * GET /api/partner/favorability - 好感度取得
 * GET /api/partner/last-pet-rarity - ペットに最後に渡したアイテムのレアリティ
 * POST /api/partner/give-item - アイテムをパートナーまたはペットに渡す（記録のみ、所持は消費しない）
 */
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Bindings, AuthUser } from '../types';
import { getFavorability } from '../services/partner-favorability';
import { giveItemToPartnerOrPet, getLastPetGrantRarity } from '../services/partner-give-item';

type PartnerVariables = { user: AuthUser };

const giveItemSchema = z.object({
  itemId: z.string().min(1, 'itemId is required'),
  target: z.enum(['partner', 'pet']),
});

export const partnerRouter = new Hono<{
  Bindings: Bindings;
  Variables: PartnerVariables;
}>();

partnerRouter.get('/favorability', async (c) => {
  const user = c.get('user');
  const value = await getFavorability(c.env.DB, user.id);
  return c.json({ favorability: value });
});

partnerRouter.get('/last-pet-rarity', async (c) => {
  const user = c.get('user');
  const lastPetRarity = await getLastPetGrantRarity(c.env.DB, user.id);
  return c.json({ lastPetRarity });
});

partnerRouter.post(
  '/give-item',
  zValidator('json', giveItemSchema),
  async (c) => {
    const user = c.get('user');
    const { itemId, target } = c.req.valid('json');
    try {
      const result = await giveItemToPartnerOrPet(c.env.DB, user.id, itemId, target);
      return c.json(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      if (message === 'USER_DOES_NOT_OWN_ITEM') {
        return c.json({ error: 'You do not own this item' }, 400);
      }
      if (message === 'ITEM_NOT_FOUND') {
        return c.json({ error: 'Item not found' }, 404);
      }
      throw err;
    }
  }
);
