/**
 * ルート別メタ設定の単体テスト（Task 7.1, Requirements 3.1, 3.2, 3.4）
 * 公開ルートは一意な title と description、非公開は汎用 title と noindex を返すことを検証する。
 */
import { describe, it, expect } from 'vitest';
import { getRouteMeta } from './route-meta';
import { PATH_LANDING, PATH_LOGIN, PATH_GENESIS, PATH_APP } from './paths';

describe('getRouteMeta (Task 7.1)', () => {
  it('returns unique title and description for landing (/)', () => {
    const meta = getRouteMeta(PATH_LANDING);
    expect(meta.title).toBeTruthy();
    expect(meta.description).toBeTruthy();
    expect(meta.noindex).not.toBe(true);
  });

  it('returns unique title and description for login', () => {
    const meta = getRouteMeta(PATH_LOGIN);
    expect(meta.title).toBeTruthy();
    expect(meta.description).toBeTruthy();
    expect(meta.noindex).not.toBe(true);
  });

  it('returns generic title and noindex for app (private) routes', () => {
    const meta = getRouteMeta(PATH_APP);
    expect(meta.title).toBeTruthy();
    expect(meta.noindex).toBe(true);
  });

  it('returns generic title and noindex for app child routes', () => {
    const meta = getRouteMeta(`${PATH_APP}/quests`);
    expect(meta.title).toBeTruthy();
    expect(meta.noindex).toBe(true);
  });

  it('returns generic title and noindex for genesis (private) routes', () => {
    const meta = getRouteMeta(PATH_GENESIS);
    expect(meta.title).toBeTruthy();
    expect(meta.noindex).toBe(true);
  });

  it('returns private meta for unknown path (noindex)', () => {
    const meta = getRouteMeta('/unknown');
    expect(meta.title).toBeTruthy();
    expect(meta.noindex).toBe(true);
  });
});
