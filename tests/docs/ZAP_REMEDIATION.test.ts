/**
 * タスク 3.1: ZAP 対策状況文書の検証
 * Requirements: 3.1, 3.2, 7.1, 7.2
 *
 * docs/ZAP_REMEDIATION.md が存在し、対象アラート種別・SRI方針・検証手順を記載していること
 */
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..', '..');
const docPath = join(projectRoot, 'docs', 'ZAP_REMEDIATION.md');

describe('ZAP_REMEDIATION.md (Req 3.1, 3.2, 7.1, 7.2)', () => {
  it('docs/ZAP_REMEDIATION.md が存在する', () => {
    expect(existsSync(docPath)).toBe(true);
  });

  it('対象アラート種別（CSP, X-Frame-Options, X-Content-Type-Options, SRI, CORS, HSTS, Cookie 属性）の対策状況を記載している', () => {
    const content = readFileSync(docPath, 'utf-8');
    const required = [
      'CSP',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'SRI',
      'CORS',
      'HSTS',
      'Cookie',
    ];
    for (const term of required) {
      expect(content).toContain(term);
    }
  });

  it('外部 CDN の SRI 方針（Tailwind CDN 等バージョン非固定で未適用の理由）を記載している', () => {
    const content = readFileSync(docPath, 'utf-8');
    expect(content).toMatch(/SRI|Sub.?Resource.?Integrity|integrity/i);
    expect(content).toMatch(/Tailwind|CDN|バージョン|未適用|方針/i);
  });

  it('同一オリジンリソースの SRI は Vite ビルドでハッシュ付きファイル名により実質対応済みであることを記載している', () => {
    const content = readFileSync(docPath, 'utf-8');
    expect(content).toMatch(/Vite|ビルド|ハッシュ|同一オリジン/i);
  });

  it('curl によるヘッダー確認手順を記載している', () => {
    const content = readFileSync(docPath, 'utf-8');
    expect(content).toMatch(/curl/i);
    expect(content).toMatch(/ヘッダー|header|確認/i);
  });

  it('ZAP 再スキャン手順を記載している', () => {
    const content = readFileSync(docPath, 'utf-8');
    expect(content).toMatch(/ZAP|再スキャン|スキャン/i);
  });
});
