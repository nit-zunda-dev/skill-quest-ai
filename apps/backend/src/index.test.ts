/**
 * Task 7.1: アプリのエントリでヘルスエンドポイントを登録する。
 * OPS_API_KEY が設定されている場合のみ運用者 API が有効（未設定時は 404）。
 * Requirements: 4.1, 6.4
 *
 * エントリ（index）を直接 import すると better-auth の解決で失敗するため、
 * エントリのソースに必要な route 登録が含まれることを静的検証する。
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const indexPath = join(__dirname, 'index.ts');

describe('Task 7.1: エントリでのヘルス・運用者API登録', () => {
  it('エントリに GET /api/health 用の healthRouter 登録が含まれる', () => {
    const source = readFileSync(indexPath, 'utf-8');
    expect(source).toContain("/api/health");
    expect(source).toContain("healthRouter");
    expect(source).toMatch(/app\.route\s*\(\s*['\"]\/api\/health['\"]\s*,\s*healthRouter\s*\)/);
  });

  it('エントリに /api/ops 用の opsRouter 登録が含まれる（OPS_API_KEY 未設定時はルート内で 404）', () => {
    const source = readFileSync(indexPath, 'utf-8');
    expect(source).toContain("/api/ops");
    expect(source).toContain("opsRouter");
    expect(source).toMatch(/app\.route\s*\(\s*['\"]\/api\/ops['\"]\s*,\s*opsRouter\s*\)/);
  });
});
