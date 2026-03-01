/**
 * Task 2.1: 環境変数で閾値・日次上限を設定できる型と取得ヘルパーのテスト。
 * 未設定時は undefined を返し、フォールバック判定を行わない契約を検証する。
 */
import { describe, it, expect } from 'vitest';
import type { Bindings } from '../types';
import { getAiNeuronsFallbackConfig } from './ai-fallback-config';

function createMinimalBindings(overrides: Partial<Bindings> = {}): Bindings {
  return {
    DB: {} as Bindings['DB'],
    AI: {} as Bindings['AI'],
    BETTER_AUTH_SECRET: 'test-secret',
    ...overrides,
  };
}

describe('getAiNeuronsFallbackConfig', () => {
  it('returns undefined threshold and dailyLimit when env vars are not set', () => {
    const env = createMinimalBindings();
    const config = getAiNeuronsFallbackConfig(env);
    expect(config.threshold).toBeUndefined();
    expect(config.dailyLimit).toBeUndefined();
  });

  it('returns threshold when AI_NEURONS_FALLBACK_THRESHOLD is set to valid number string', () => {
    const env = createMinimalBindings({ AI_NEURONS_FALLBACK_THRESHOLD: '50000' });
    const config = getAiNeuronsFallbackConfig(env);
    expect(config.threshold).toBe(50000);
    expect(config.dailyLimit).toBeUndefined();
  });

  it('returns dailyLimit when AI_NEURONS_DAILY_LIMIT is set to valid number string', () => {
    const env = createMinimalBindings({ AI_NEURONS_DAILY_LIMIT: '100000' });
    const config = getAiNeuronsFallbackConfig(env);
    expect(config.threshold).toBeUndefined();
    expect(config.dailyLimit).toBe(100000);
  });

  it('returns both when both env vars are set', () => {
    const env = createMinimalBindings({
      AI_NEURONS_FALLBACK_THRESHOLD: '30000',
      AI_NEURONS_DAILY_LIMIT: '80000',
    });
    const config = getAiNeuronsFallbackConfig(env);
    expect(config.threshold).toBe(30000);
    expect(config.dailyLimit).toBe(80000);
  });

  it('returns undefined threshold when AI_NEURONS_FALLBACK_THRESHOLD is empty string', () => {
    const env = createMinimalBindings({ AI_NEURONS_FALLBACK_THRESHOLD: '' });
    const config = getAiNeuronsFallbackConfig(env);
    expect(config.threshold).toBeUndefined();
  });

  it('returns undefined threshold when AI_NEURONS_FALLBACK_THRESHOLD is not a number', () => {
    const env = createMinimalBindings({ AI_NEURONS_FALLBACK_THRESHOLD: 'not-a-number' });
    const config = getAiNeuronsFallbackConfig(env);
    expect(config.threshold).toBeUndefined();
  });

  it('returns undefined dailyLimit when AI_NEURONS_DAILY_LIMIT is not a number', () => {
    const env = createMinimalBindings({ AI_NEURONS_DAILY_LIMIT: 'invalid' });
    const config = getAiNeuronsFallbackConfig(env);
    expect(config.dailyLimit).toBeUndefined();
  });

  it('rejects negative threshold (treats as invalid)', () => {
    const env = createMinimalBindings({ AI_NEURONS_FALLBACK_THRESHOLD: '-1' });
    const config = getAiNeuronsFallbackConfig(env);
    expect(config.threshold).toBeUndefined();
  });

  it('rejects negative dailyLimit (treats as invalid)', () => {
    const env = createMinimalBindings({ AI_NEURONS_DAILY_LIMIT: '-100' });
    const config = getAiNeuronsFallbackConfig(env);
    expect(config.dailyLimit).toBeUndefined();
  });
});
