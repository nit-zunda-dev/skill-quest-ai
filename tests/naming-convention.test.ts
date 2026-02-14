/**
 * タスク 9.1: テストファイル命名規則の検証
 * Requirements: 10.1, 10.2, 10.3
 *
 * 単体テスト: *.test.ts または *.test.tsx
 * 統合テスト: *.integration.test.ts
 * E2Eテスト: *.e2e.test.ts
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const UNIT_TEST_PATTERN = /\.(test)\.(ts|tsx)$/;
const INTEGRATION_TEST_PATTERN = /\.integration\.test\.ts$/;
const E2E_TEST_PATTERN = /\.e2e\.test\.ts$/;

function collectTestFiles(
  dir: string,
  patterns: RegExp[],
  baseDir: string
): { path: string; relative: string }[] {
  const results: { path: string; relative: string }[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        if (!['node_modules', 'dist', '.git'].includes(entry)) {
          results.push(
            ...collectTestFiles(fullPath, patterns, baseDir)
          );
        }
      } else if (patterns.some((p) => p.test(entry))) {
        results.push({
          path: fullPath,
          relative: fullPath.replace(baseDir + (process.platform === 'win32' ? '\\' : '/'), ''),
        });
      }
    }
  } catch {
    // ディレクトリが存在しない場合はスキップ
  }
  return results;
}

describe('テストファイル命名規則 (Req 10.1, 10.2, 10.3)', () => {
  it('単体テストは *.test.ts または *.test.tsx に従う', () => {
    const unitDirs = [
      join(projectRoot, 'apps', 'frontend', 'src'),
      join(projectRoot, 'apps', 'backend', 'src'),
      join(projectRoot, 'apps', 'backend', 'tests'),
      join(projectRoot, 'packages', 'shared', 'src'),
      join(projectRoot, 'tests'),
    ];

    const invalid: string[] = [];
    for (const dir of unitDirs) {
      const files = collectTestFiles(dir, [UNIT_TEST_PATTERN, INTEGRATION_TEST_PATTERN], projectRoot);
      for (const f of files) {
        const name = f.path.split(/[/\\]/).pop() ?? '';
        // 統合テストは unit ディレクトリには含めない（backend/src は例外で両方ある）
        if (INTEGRATION_TEST_PATTERN.test(name)) continue;
        if (!UNIT_TEST_PATTERN.test(name)) {
          invalid.push(f.relative);
        }
      }
    }
    expect(invalid).toEqual([]);
  });

  it('統合テストは *.integration.test.ts に従う', () => {
    const integrationDirs = [
      join(projectRoot, 'apps', 'backend', 'src'),
    ];

    const invalid: string[] = [];
    for (const dir of integrationDirs) {
      const files = collectTestFiles(dir, [INTEGRATION_TEST_PATTERN], projectRoot);
      for (const f of files) {
        const name = f.path.split(/[/\\]/).pop() ?? '';
        if (!INTEGRATION_TEST_PATTERN.test(name)) {
          invalid.push(f.relative);
        }
      }
    }
    expect(invalid).toEqual([]);
  });

  it('E2Eテストは *.e2e.test.ts に従う', () => {
    const e2eDir = join(projectRoot, 'e2e');
    const files = collectTestFiles(e2eDir, [E2E_TEST_PATTERN, /\.test\.ts$/], projectRoot);

    const invalid: string[] = [];
    for (const f of files) {
      const name = f.path.split(/[/\\]/).pop() ?? '';
      // E2E ディレクトリ内のテストは *.e2e.test.ts であること
      if (name.endsWith('.test.ts') && !E2E_TEST_PATTERN.test(name)) {
        invalid.push(f.relative);
      }
    }
    expect(invalid).toEqual([]);
  });
});
