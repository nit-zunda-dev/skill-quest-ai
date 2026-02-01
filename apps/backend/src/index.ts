import { Hono } from 'hono';
import type { Env } from './types';

// Honoアプリケーションを初期化
const app = new Hono<{ Bindings: Env }>();

// 基本的なルート（ヘルスチェック）
app.get('/', (c) => {
  return c.json({ message: 'Skill Quest AI Backend API' });
});

// AppTypeをエクスポート（フロントエンドで型推論に使用）
export type AppType = typeof app;
export default app;
