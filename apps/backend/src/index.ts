import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import type { Bindings } from './types';
import { setupMiddleware } from './middleware';
import { auth } from './auth';
import { authMiddleware } from './middleware/auth';
import { profileRouter } from './routes/profile';
import { healthRouter } from './routes/health';
import { opsRouter } from './routes/ops';
import { deleteAccountByUserId } from './services/account-delete';

const userIdParamSchema = z.object({
  userId: z.string().min(1, 'ユーザーIDは必須です'),
});

const app = new Hono<{ Bindings: Bindings }>();

setupMiddleware(app);

app.get('/', (c) => {
  return c.json({ message: 'Skill Quest AI Backend API' });
});

app.route('/api/health', healthRouter);
app.route('/api/ops', opsRouter);

app.get('/test-bindings', (c) => {
  const hasDB = !!c.env.DB;
  const hasAuthSecret = !!c.env.BETTER_AUTH_SECRET;

  return c.json({
    bindingsAvailable: {
      DB: hasDB,
      BETTER_AUTH_SECRET: hasAuthSecret,
    },
  });
});

app.get('/test-error', () => {
  throw new HTTPException(400, { message: 'Test error for error handler' });
});

app.get('/test-cors', (c) => {
  return c.json({
    message: 'CORS headers should be set',
    headers: {
      'Access-Control-Allow-Credentials': c.res.headers.get('Access-Control-Allow-Credentials'),
    },
  });
});

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  if (!c.env?.DB) {
    return c.json({ error: 'Database binding not available' }, 500);
  }

  const authInstance = auth(c.env, c.req.raw);
  return authInstance.handler(c.req.raw);
});

app.use('/api/profile/*', authMiddleware);
app.route('/api/profile', profileRouter);

app.get('/api/test-protected', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json({
    message: 'This is a protected endpoint',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
    },
  });
});

app.delete(
  '/api/users/:userId',
  authMiddleware,
  zValidator('param', userIdParamSchema),
  async (c) => {
    const user = c.get('user');
    const { userId } = c.req.valid('param');

    if (userId !== user.id) {
      throw new HTTPException(403, { message: 'Forbidden: You can only delete your own account' });
    }

    try {
      await deleteAccountByUserId(c.env.DB, userId);
      return c.json({ success: true, message: 'Account and all related data deleted successfully' });
    } catch (error) {
      if (error instanceof Error && error.message === 'USER_NOT_FOUND') {
        throw new HTTPException(404, { message: 'User not found' });
      }
      console.error('Account deletion error:', error);
      throw new HTTPException(500, { message: 'Failed to delete account' });
    }
  }
);

export type AppType = typeof app;
export default app;
