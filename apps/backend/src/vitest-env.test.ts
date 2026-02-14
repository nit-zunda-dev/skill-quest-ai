/**
 * バックエンドテスト環境の検証（Req 9.2, 9.3, 9.4）
 * - node環境で実行されていること
 * - ウォッチモード（test:watch）・CIヘッドレスは package.json / CI ワークフローで保証
 */
import { describe, it, expect } from 'vitest';

describe('Backend Vitest environment', () => {
  it('runs in node environment', () => {
    expect(typeof process).toBe('object');
    expect(typeof process.env).toBe('object');
    expect(typeof globalThis.document).toBe('undefined');
  });
});
