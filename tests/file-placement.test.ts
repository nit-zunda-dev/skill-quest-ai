/**
 * タスク 9.2: テストファイル配置の検証
 * Requirements: 10.4, 10.5, 10.6
 *
 * - Co-located pattern: 単体・統合テストは対象ファイルと同階層
 * - E2Eテスト: e2e/ ディレクトリに配置
 * - Vitest: include パターンが正しく定義されていること
 */
import { describe, it, expect } from 'vitest';
import { readdirSync, statSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const UNIT_TEST_PATTERN = /\.(test)\.(ts|tsx)$/;
const INTEGRATION_TEST_PATTERN = /\.integration\.test\.ts$/;
const E2E_TEST_PATTERN = /\.e2e\.test\.ts$/;

function collectFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        if (!['node_modules', 'dist', '.git'].includes(entry)) {
          results.push(...collectFiles(fullPath, pattern));
        }
      } else if (pattern.test(entry)) {
        results.push(fullPath);
      }
    }
  } catch {
    // ディレクトリが存在しない場合はスキップ
  }
  return results;
}

function toRelative(path: string): string {
  return path.replace(projectRoot + (process.platform === 'win32' ? '\\' : '/'), '');
}

describe('テストファイル配置 (Req 10.4, 10.5, 10.6)', () => {
  it('単体・統合テストはCo-located patternに従う（対象と同階層）', () => {
    const allowedPrefixes = [
      join(projectRoot, 'apps', 'frontend', 'src'),
      join(projectRoot, 'apps', 'backend', 'src'),
      join(projectRoot, 'apps', 'backend', 'tests'),
      join(projectRoot, 'packages', 'shared', 'src'),
      join(projectRoot, 'tests'),
    ];

    const unitAndIntegration = [
      ...collectFiles(join(projectRoot, 'apps', 'frontend', 'src'), UNIT_TEST_PATTERN),
      ...collectFiles(join(projectRoot, 'apps', 'backend', 'src'), UNIT_TEST_PATTERN),
      ...collectFiles(join(projectRoot, 'apps', 'backend', 'src'), INTEGRATION_TEST_PATTERN),
      ...collectFiles(join(projectRoot, 'apps', 'backend', 'tests'), UNIT_TEST_PATTERN),
      ...collectFiles(join(projectRoot, 'packages', 'shared', 'src'), UNIT_TEST_PATTERN),
      ...collectFiles(join(projectRoot, 'tests'), UNIT_TEST_PATTERN),
    ];

    const violations: string[] = [];
    for (const file of unitAndIntegration) {
      const isAllowed = allowedPrefixes.some((prefix) =>
        file === prefix || file.startsWith(prefix + (process.platform === 'win32' ? '\\' : '/'))
      );
      if (!isAllowed) {
        violations.push(toRelative(file));
      }
    }
    expect(violations).toEqual([]);
  });

  it('E2Eテストはe2e/ディレクトリに配置されている', () => {
    const e2eDir = join(projectRoot, 'e2e');
    const e2eTests = collectFiles(e2eDir, E2E_TEST_PATTERN);

    const allE2ETests = collectFiles(projectRoot, E2E_TEST_PATTERN);
    const violations = allE2ETests.filter(
      (f) => !f.startsWith(e2eDir + (process.platform === 'win32' ? '\\' : '/'))
    );

    expect(violations.map(toRelative)).toEqual([]);
    expect(e2eTests.length).toBeGreaterThan(0);
  });

  it('Vitestのincludeパターンが正しく定義されている', () => {
    const expectedPatterns: { config: string; includes: string[] }[] = [
      {
        config: join(projectRoot, 'apps', 'frontend', 'vitest.config.ts'),
        includes: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
      },
      {
        config: join(projectRoot, 'apps', 'backend', 'vitest.config.ts'),
        includes: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
      },
      {
        config: join(projectRoot, 'packages', 'shared', 'vitest.config.ts'),
        includes: ['src/**/*.test.ts'],
      },
      {
        config: join(projectRoot, 'vitest.config.ts'),
        includes: ['tests/**/*.test.ts'],
      },
      {
        config: join(projectRoot, 'apps', 'backend', 'vitest.integration.config.ts'),
        includes: ['src/**/*.integration.test.ts'],
      },
    ];

    const violations: string[] = [];
    for (const { config, includes } of expectedPatterns) {
      const content = readFileSync(config, 'utf-8');
      for (const pattern of includes) {
        if (!content.includes(pattern)) {
          violations.push(`${config}: missing include '${pattern}'`);
        }
      }
    }
    expect(violations).toEqual([]);
  });
});
