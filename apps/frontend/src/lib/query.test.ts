/**
 * TanStack Query セットアップのテスト（タスク 8.2）
 * - createQueryClient が適切な設定の QueryClient を返すことを検証
 */
import { describe, it, expect } from 'vitest';
import { createQueryClient } from './query';

describe('TanStack Query setup', () => {
  it('createQueryClient が QueryClient インスタンスを返す', () => {
    const client = createQueryClient();
    expect(client).toBeDefined();
    expect(client.getQueryCache).toBeDefined();
    expect(typeof client.getQueryCache).toBe('function');
  });

  it('QueryClient でクエリを実行できる', async () => {
    const client = createQueryClient();
    const data = await client.fetchQuery({
      queryKey: ['test'],
      queryFn: () => Promise.resolve('ok'),
    });
    expect(data).toBe('ok');
  });
});
