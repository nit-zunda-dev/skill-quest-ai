import { describe, it, expect } from 'vitest';
import { getRouteMeta, NOT_FOUND_META } from './route-meta';
import { PATH_LANDING, PATH_LOGIN, PATH_ACCOUNT } from './paths';

describe('getRouteMeta', () => {
  it('returns public meta for landing and login', () => {
    expect(getRouteMeta(PATH_LANDING).title).toBeTruthy();
    expect(getRouteMeta(PATH_LANDING).noindex).not.toBe(true);
    expect(getRouteMeta(PATH_LOGIN).description).toBeTruthy();
  });

  it('returns private meta for account routes', () => {
    expect(getRouteMeta(PATH_ACCOUNT).noindex).toBe(true);
    expect(getRouteMeta(`${PATH_ACCOUNT}/x`).noindex).toBe(true);
  });

  it('exports NOT_FOUND_META', () => {
    expect(NOT_FOUND_META.title).toContain('見つかりません');
    expect(NOT_FOUND_META.noindex).toBe(true);
  });
});
