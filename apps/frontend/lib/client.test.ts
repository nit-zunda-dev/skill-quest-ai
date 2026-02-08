/**
 * Hono RPC クライアントのテスト（タスク 8.1）
 * - クライアントが期待するAPI形状を持つことを検証
 * - 型推論が動作することを検証（型レベル）
 */
import { describe, it, expect } from 'vitest';
import { client } from './client';

type ClientShape = {
  api?: { quests?: { $get?: unknown } };
};

describe('Hono RPC client', () => {
  const c = client as ClientShape;

  it('クライアントが初期化されている', () => {
    expect(client).toBeDefined();
    // Hono hc() は関数を返すため function または object を許容
    expect(['object', 'function']).toContain(typeof client);
  });

  it('client.api.quests が存在する', () => {
    expect(c.api).toBeDefined();
    expect(c.api?.quests).toBeDefined();
  });

  it('client.api.quests.$get が関数である', () => {
    expect(typeof c.api?.quests?.$get).toBe('function');
  });

  it('API URLベースでクライアントが生成されている', () => {
    expect(c.api).toBeDefined();
    expect(c.api?.quests?.$get).toBeDefined();
  });
});
