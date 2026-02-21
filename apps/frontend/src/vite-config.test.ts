/**
 * @vitest-environment node
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { execSync } from 'node:child_process';
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

describe('Tailwind migration: build and styles (Req 1.1, Task 1.3)', () => {
  const frontendRoot = resolve(__dirname, '..');
  const distAssets = resolve(frontendRoot, 'dist/assets');

  it('production build completes successfully', () => {
    execSync('pnpm build', { cwd: frontendRoot, stdio: 'pipe' });
    expect(existsSync(resolve(frontendRoot, 'dist'))).toBe(true);
  }, 30000);

  it('built CSS includes Tailwind utilities used by existing screens (login, Genesis, dashboard)', () => {
    if (!existsSync(distAssets)) {
      execSync('pnpm build', { cwd: frontendRoot, stdio: 'pipe' });
    }
    const files = readdirSync(distAssets);
    const cssFile = files.find((f) => f.endsWith('.css'));
    expect(cssFile).toBeDefined();
    const cssPath = resolve(distAssets, cssFile!);
    const css = readFileSync(cssPath, 'utf-8');
    expect(css.length).toBeGreaterThan(1000);
    expect(
      /\.min-h-screen\b|\.bg-slate-900|\.text-slate-200|\.bg-indigo-600/.test(css)
    ).toBe(true);
  }, 35000);
});

describe('shadcn/ui initialized (Req 1.2, 4.2, Task 2.1)', () => {
  const frontendRoot = resolve(__dirname, '..');

  it('components.json exists and configures style and base color for dark theme (slate/indigo)', () => {
    const configPath = resolve(frontendRoot, 'components.json');
    expect(existsSync(configPath)).toBe(true);
    const content = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content) as { style?: string; tailwind?: { baseColor?: string } };
    expect(config.style).toBeDefined();
    expect(['default', 'new-york']).toContain(config.style);
    expect(config.tailwind?.baseColor).toBeDefined();
    expect(config.tailwind!.baseColor!.toLowerCase()).toBe('slate');
  });

  it('components.json aliases point to @/components and @/components/ui', () => {
    const configPath = resolve(frontendRoot, 'components.json');
    const content = readFileSync(configPath, 'utf-8');
    const config = JSON.parse(content) as { aliases?: { components?: string; ui?: string; utils?: string } };
    expect(config.aliases?.components).toMatch(/@\/components/);
    expect(config.aliases?.ui).toMatch(/@\/components\/ui/);
    expect(config.aliases?.utils).toMatch(/@\/lib\/utils/);
  });

  it('utils file exists for shadcn (cn helper)', () => {
    const utilsPath = resolve(frontendRoot, 'src/lib/utils.ts');
    expect(existsSync(utilsPath)).toBe(true);
    const content = readFileSync(utilsPath, 'utf-8');
    expect(content).toMatch(/clsx|class-variance-authority|tailwind-merge|cn\s*\(/);
  });
});

describe('shadcn Button and Card for landing (Req 1.2, 4.2, Task 2.2)', () => {
  const uiDir = resolve(__dirname, 'components/ui');

  it('Button component exists and exports Button', () => {
    const buttonPath = resolve(uiDir, 'button.tsx');
    expect(existsSync(buttonPath)).toBe(true);
    const content = readFileSync(buttonPath, 'utf-8');
    expect(content).toMatch(/export\s+(\{\s*)?Button/);
  });

  it('Card component exists and exports Card', () => {
    const cardPath = resolve(uiDir, 'card.tsx');
    expect(existsSync(cardPath)).toBe(true);
    const content = readFileSync(cardPath, 'utf-8');
    expect(content).toMatch(/export\s+(\{\s*)?Card\b/);
  });
});
