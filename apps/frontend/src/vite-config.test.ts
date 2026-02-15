/**
 * @vitest-environment node
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, it, expect } from 'vitest';

describe('Vite dev server security headers', () => {
  it('sets X-Frame-Options and X-Content-Type-Options in server.headers', () => {
    const configPath = resolve(__dirname, '../vite.config.ts');
    const content = readFileSync(configPath, 'utf-8');
    expect(content).toContain('X-Frame-Options');
    expect(content).toContain('X-Content-Type-Options');
    expect(content).toContain('SAMEORIGIN');
    expect(content).toContain('nosniff');
    expect(content).toMatch(/server:\s*\{[\s\S]*?headers:\s*\{/);
  });
});
