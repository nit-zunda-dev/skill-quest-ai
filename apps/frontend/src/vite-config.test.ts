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

  it('CSP allows index.html external resources (esm.sh, fonts)', () => {
    const headersPath = resolve(__dirname, '../public/_headers');
    const content = readFileSync(headersPath, 'utf-8');
    expect(content).toMatch(/script-src[^;]*esm\.sh/);
    expect(content).toMatch(/style-src[^;]*fonts\.googleapis\.com/);
    expect(content).toMatch(/font-src[^;]*fonts\.gstatic\.com/);
  });
});

describe('Tailwind CSS npm bundle (Req 1.1)', () => {
  it('Vite config includes @tailwindcss/vite plugin', () => {
    const configPath = resolve(__dirname, '../vite.config.ts');
    const content = readFileSync(configPath, 'utf-8');
    expect(content).toContain('@tailwindcss/vite');
    expect(content).toMatch(/tailwindcss\s*\(\s*\)/);
  });

  it('main CSS file exists and imports Tailwind', () => {
    const cssPath = resolve(__dirname, 'index.css');
    expect(existsSync(cssPath)).toBe(true);
    const content = readFileSync(cssPath, 'utf-8');
    expect(content).toMatch(/@import\s+["']tailwindcss["']/);
  });

  it('main entry imports the main CSS so styles are bundled', () => {
    const mainPath = resolve(__dirname, 'main.tsx');
    const content = readFileSync(mainPath, 'utf-8');
    expect(content).toMatch(/import\s+['"].*\.css['"]/);
  });
});

describe('Tailwind CDN removed from index.html (Req 1.1, Task 1.2)', () => {
  it('index.html does not load Tailwind CDN script', () => {
    const indexPath = resolve(__dirname, '../index.html');
    const content = readFileSync(indexPath, 'utf-8');
    expect(content).not.toMatch(/cdn\.tailwindcss\.com/);
  });

  it('index.html preserves inline styles (fonts, body, scrollbar)', () => {
    const indexPath = resolve(__dirname, '../index.html');
    const content = readFileSync(indexPath, 'utf-8');
    expect(content).toMatch(/fonts\.googleapis\.com/);
    expect(content).toMatch(/Zen Kaku Gothic New|Cinzel/);
    expect(content).toMatch(/#0f172a|Slate 900/);
    expect(content).toMatch(/\.font-display/);
    expect(content).toMatch(/::-webkit-scrollbar/);
  });
});
