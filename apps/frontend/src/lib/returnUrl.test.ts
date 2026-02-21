/**
 * returnUrl 検証ユーティリティのテスト（Task 2.2, Requirements 4.1）
 * 同一オリジンかつアプリ内パス（/app で始まる）のみ許可し、無効な値は /app へフォールバックする。
 */
import { describe, it, expect } from 'vitest';
import { getValidReturnUrl } from '@/lib/returnUrl';
import { PATH_APP } from '@/lib/paths';

describe('getValidReturnUrl', () => {
  it('returns pathname + search when pathname starts with /app', () => {
    expect(getValidReturnUrl('/app', '')).toBe('/app');
    expect(getValidReturnUrl('/app/', '')).toBe('/app/');
    expect(getValidReturnUrl('/app/quests', '')).toBe('/app/quests');
    expect(getValidReturnUrl('/app/quests', '?foo=1')).toBe('/app/quests?foo=1');
    expect(getValidReturnUrl('/app/grimoire', '')).toBe('/app/grimoire');
  });

  it('returns PATH_APP when pathname is not app-internal', () => {
    expect(getValidReturnUrl('/', '')).toBe(PATH_APP);
    expect(getValidReturnUrl('/login', '')).toBe(PATH_APP);
    expect(getValidReturnUrl('/genesis', '')).toBe(PATH_APP);
    expect(getValidReturnUrl('/other', '')).toBe(PATH_APP);
  });

  it('returns PATH_APP for pathname that does not start with /app', () => {
    expect(getValidReturnUrl('/appetizer', '')).toBe(PATH_APP);
    expect(getValidReturnUrl('/application', '')).toBe(PATH_APP);
  });
});
