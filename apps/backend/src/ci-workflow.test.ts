/**
 * CIワークフロー検証テスト (Requirement 7.1, 7.2, 7.3, 7.4)
 * - Lint → 型チェック → ビルド → 単体テストの順序
 * - mainマージ時にも全チェックが実行されること (7.2)
 * - テスト失敗時にPRマージがブロックされること
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect } from 'vitest';

const REPO_ROOT = join(process.cwd(), '..', '..');
const WORKFLOW_PATH = join(REPO_ROOT, '.github', 'workflows', 'check.yml');

describe('CI workflow (check.yml)', () => {
  let content: string;

  it('workflow file exists and is readable', () => {
    content = readFileSync(WORKFLOW_PATH, 'utf-8');
    expect(content.length).toBeGreaterThan(0);
  });

  it('runs on pull_request and push to main and develop', () => {
    expect(content).toMatch(/pull_request:/);
    expect(content).toMatch(/branches:\s*\n\s*- main/);
    expect(content).toMatch(/- develop/);
    expect(content).toMatch(/push:/);
  });

  it('runs full check on push to main so merge to main triggers all checks (7.2)', () => {
    const pushStart = content.indexOf('push:');
    expect(pushStart).toBeGreaterThan(-1);
    const afterPush = content.slice(pushStart, content.indexOf('jobs:'));
    expect(afterPush).toMatch(/- main/);
    expect(afterPush).toMatch(/branches:/);
  });

  it('has job "check" with steps in order: Lint → Type check → Build → Test', () => {
    const lintIdx = content.indexOf('name: Lint');
    const typeCheckIdx = content.indexOf('name: Type check');
    const buildIdx = content.indexOf('name: Build');
    const testIdx = content.indexOf('name: Test with coverage');

    expect(lintIdx).toBeGreaterThan(-1);
    expect(typeCheckIdx).toBeGreaterThan(lintIdx);
    expect(buildIdx).toBeGreaterThan(typeCheckIdx);
    expect(testIdx).toBeGreaterThan(buildIdx);
  });

  it('critical steps do not use continue-on-error: true (failures block merge)', () => {
    const criticalStepNames = ['Lint', 'Type check', 'Build', 'Test with coverage'];
    const stepsBlock = content.includes('jobs:')
      ? content.slice(content.indexOf('jobs:'))
      : content;
    for (const name of criticalStepNames) {
      const stepStart = stepsBlock.indexOf(`name: ${name}`);
      expect(stepStart).toBeGreaterThan(-1);
      const nextStep = stepsBlock.indexOf('\n      - name:', stepStart + 1);
      const stepContent =
        nextStep > -1
          ? stepsBlock.slice(stepStart, nextStep)
          : stepsBlock.slice(stepStart, stepStart + 500);
      expect(stepContent).not.toMatch(/continue-on-error:\s*true/);
    }
  });

  it('uses Turbo for type-check, build, and test (parallel execution)', () => {
    expect(content).toMatch(/pnpm run type-check/);
    expect(content).toMatch(/pnpm run build/);
    expect(content).toMatch(/pnpm run test/);
  });

  describe('E2E test CI integration (7.3, 7.6, 12.1-12.7)', () => {
    it('has E2E job that runs only on PR to main', () => {
      expect(content).toMatch(/e2e|E2E|playwright/i);
      expect(content).toMatch(/github\.base_ref == 'main'/);
      expect(content).not.toMatch(/github\.base_ref == 'develop'/);
    });

    it('runs Playwright in CI (headless)', () => {
      expect(content).toMatch(/test:e2e|playwright test/);
      expect(content).toMatch(/CI:\s*true|CI=true/);
    });

    it('uploads E2E artifacts on failure (screenshot, video, trace)', () => {
      expect(content).toMatch(/failure\(\)|if:\s*failure/);
      expect(content).toMatch(/upload-artifact|playwright-report|test-results/);
    });

    it('has E2E job timeout of 30 minutes', () => {
      expect(content).toMatch(/timeout-minutes:\s*30|30\s*min/);
    });

    it('has wait for preview or deploy step (healthcheck or wrangler)', () => {
      const hasWait =
        /Wait for preview|wait.*preview|deploy.*complete|wrangler deployments|health|curl.*E2E_BASE_URL/i.test(
          content
        );
      expect(hasWait).toBe(true);
    });
  });
});
