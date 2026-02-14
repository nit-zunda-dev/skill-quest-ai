/**
 * Task 8.4: Miniflare設定の確認（Req 9.5）
 * 統合テストが Workers 環境のローカルエミュレーション（Miniflare / vitest-pool-workers）で
 * 実行されていることを検証する。env.DB（D1）が利用可能であることと簡単なクエリで確認する。
 */
import { env } from 'cloudflare:test';
import { describe, expect, it } from 'vitest';

describe('Miniflare / Workers environment (Task 8.4)', () => {
  it('provides D1 binding (env.DB) for local emulation', () => {
    expect(env.DB).toBeDefined();
    expect(typeof env.DB.prepare).toBe('function');
  });

  it('executes a simple D1 query in the Workers environment', async () => {
    const result = await env.DB.prepare('SELECT 1 AS value').first<{ value: number }>();
    expect(result).not.toBeNull();
    expect(result?.value).toBe(1);
  });
});
