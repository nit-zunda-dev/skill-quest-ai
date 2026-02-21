/**
 * パス定数の単体テスト（Task 1.1, Requirements 1.1, 5.2）
 * ランディング・ログイン・Genesis・アプリ（ダッシュボード）の正規形が単一に定まっていることを検証する。
 */
import { describe, it, expect } from 'vitest';
import {
  PATH_LANDING,
  PATH_LOGIN,
  PATH_GENESIS,
  PATH_APP,
  PATH_APP_QUESTS,
  PATH_APP_GRIMOIRE,
  PATH_APP_PARTNER,
  PATH_APP_ITEMS,
  GENESIS_STEP_SLUGS,
  getGenesisStepPath,
  PATH_GENESIS_INTRO,
} from '@/lib/paths';

describe('path constants (Task 1.1)', () => {
  it('defines canonical landing path as /', () => {
    expect(PATH_LANDING).toBe('/');
  });

  it('defines canonical login path as /login', () => {
    expect(PATH_LOGIN).toBe('/login');
  });

  it('defines canonical genesis path as /genesis', () => {
    expect(PATH_GENESIS).toBe('/genesis');
  });

  it('defines canonical app (dashboard) path as /app', () => {
    expect(PATH_APP).toBe('/app');
  });

  it('defines dashboard child paths under /app', () => {
    expect(PATH_APP_QUESTS).toBe('/app/quests');
    expect(PATH_APP_GRIMOIRE).toBe('/app/grimoire');
    expect(PATH_APP_PARTNER).toBe('/app/partner');
    expect(PATH_APP_ITEMS).toBe('/app/items');
  });

  it('ensures app child paths are prefixed with PATH_APP', () => {
    expect(PATH_APP_QUESTS.startsWith(PATH_APP)).toBe(true);
    expect(PATH_APP_GRIMOIRE.startsWith(PATH_APP)).toBe(true);
    expect(PATH_APP_PARTNER.startsWith(PATH_APP)).toBe(true);
    expect(PATH_APP_ITEMS.startsWith(PATH_APP)).toBe(true);
  });
});

describe('Genesis step paths (Task 10.1)', () => {
  it('defines GENESIS_STEP_SLUGS as intro, questions, loading, result, suggest', () => {
    expect(GENESIS_STEP_SLUGS).toEqual(['intro', 'questions', 'loading', 'result', 'suggest']);
  });

  it('getGenesisStepPath returns /genesis/<step> for each slug', () => {
    expect(getGenesisStepPath('intro')).toBe('/genesis/intro');
    expect(getGenesisStepPath('questions')).toBe('/genesis/questions');
    expect(getGenesisStepPath('loading')).toBe('/genesis/loading');
    expect(getGenesisStepPath('result')).toBe('/genesis/result');
    expect(getGenesisStepPath('suggest')).toBe('/genesis/suggest');
  });

  it('PATH_GENESIS_INTRO is /genesis/intro', () => {
    expect(PATH_GENESIS_INTRO).toBe('/genesis/intro');
  });
});
