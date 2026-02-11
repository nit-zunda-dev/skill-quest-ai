/**
 * Task 13.1: wrangler.toml の環境分離を検証するテスト
 * - [env.preview] と [env.production] が定義されていること
 * - 本番とプレビューで異なる D1 database_id が設定されていること
 * - 各環境で FRONTEND_URL と AI バインディングが設定されていること
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const WRANGLER_PATH = join(__dirname, '..', 'wrangler.toml');

function readWranglerToml(): string {
  return readFileSync(WRANGLER_PATH, 'utf-8');
}

function extractEnvD1DatabaseId(content: string, env: 'preview' | 'production'): string | null {
  const section = env === 'preview' ? 'env.preview' : 'env.production';
  const regex = new RegExp(
    `\\[\\[${section}\\.d1_databases\\]\\][\\s\\S]*?database_id\\s*=\\s*"([^"]+)"`,
    'm'
  );
  const match = content.match(regex);
  return match ? match[1] : null;
}

describe('wrangler.toml environment separation (Task 13.1)', () => {
  const content = readWranglerToml();

  it('defines [env.preview] section', () => {
    expect(content).toMatch(/\[env\.preview\]/);
  });

  it('defines [env.production] section', () => {
    expect(content).toMatch(/\[env\.production\]/);
  });

  it('sets different D1 database_id for preview and production (not local)', () => {
    const previewId = extractEnvD1DatabaseId(content, 'preview');
    const productionId = extractEnvD1DatabaseId(content, 'production');

    expect(previewId).toBeTruthy();
    expect(productionId).toBeTruthy();
    expect(previewId).not.toBe('local');
    expect(productionId).not.toBe('local');
    expect(previewId).not.toBe(productionId);
  });

  it('sets FRONTEND_URL for preview environment', () => {
    expect(content).toMatch(/\[env\.preview\][\s\S]*?FRONTEND_URL/);
  });

  it('sets FRONTEND_URL for production environment', () => {
    expect(content).toMatch(/\[env\.production\][\s\S]*?FRONTEND_URL/);
  });

  it('configures AI binding for preview', () => {
    expect(content).toMatch(/\[env\.preview\.ai\]/);
    expect(content).toMatch(/\[env\.preview\.ai\][\s\S]*?binding\s*=\s*"AI"/);
  });

  it('configures AI binding for production', () => {
    expect(content).toMatch(/\[env\.production\.ai\]/);
    expect(content).toMatch(/\[env\.production\.ai\][\s\S]*?binding\s*=\s*"AI"/);
  });

  it('configures D1 binding "DB" for preview and production', () => {
    expect(content).toMatch(/\[\[env\.preview\.d1_databases\]\][\s\S]*?binding\s*=\s*"DB"/);
    expect(content).toMatch(/\[\[env\.production\.d1_databases\]\][\s\S]*?binding\s*=\s*"DB"/);
  });
});
