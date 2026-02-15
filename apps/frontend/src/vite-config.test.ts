/**
 * @vitest-environment node
 */
import { readFileSync, existsSync } from 'node:fs';
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

describe('Production _headers file (Cloudflare Pages)', () => {
  it('exists under public/ and is included in build output', () => {
    const headersPath = resolve(__dirname, '../public/_headers');
    expect(existsSync(headersPath)).toBe(true);
  });

  it('sets X-Frame-Options, X-Content-Type-Options, HSTS, and CSP', () => {
    const headersPath = resolve(__dirname, '../public/_headers');
    const content = readFileSync(headersPath, 'utf-8');
    expect(content).toContain('X-Frame-Options: SAMEORIGIN');
    expect(content).toContain('X-Content-Type-Options: nosniff');
    expect(content).toContain('Strict-Transport-Security:');
    expect(content).toMatch(
      /Content-Security-Policy(-Report-Only)?:\s*default-src/
    );
  });

  it('CSP allows index.html external resources (cdn.tailwindcss.com, esm.sh, fonts)', () => {
    const headersPath = resolve(__dirname, '../public/_headers');
    const content = readFileSync(headersPath, 'utf-8');
    expect(content).toMatch(/script-src[^;]*cdn\.tailwindcss\.com/);
    expect(content).toMatch(/script-src[^;]*esm\.sh/);
    expect(content).toMatch(/style-src[^;]*fonts\.googleapis\.com/);
    expect(content).toMatch(/font-src[^;]*fonts\.gstatic\.com/);
  });
});
