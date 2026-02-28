/**
 * パートナー好感度: チャット内容からの変動量算出の単体テスト
 */
import { describe, it, expect } from 'vitest';
import {
  getFavorabilityDeltaFromMessage,
  FAVORABILITY_BY_RARITY,
  FAVORABILITY_MAX,
  FAVORABILITY_MIN,
} from './partner-favorability';

describe('partner-favorability', () => {
  describe('getFavorabilityDeltaFromMessage', () => {
    it('空文字のとき 0 を返す', () => {
      expect(getFavorabilityDeltaFromMessage('')).toBe(0);
      expect(getFavorabilityDeltaFromMessage('   ')).toBe(0);
    });

    it('ネガティブキーワードを含むとき 0 を返す', () => {
      expect(getFavorabilityDeltaFromMessage('つらい')).toBe(0);
      expect(getFavorabilityDeltaFromMessage('無理だ')).toBe(0);
      expect(getFavorabilityDeltaFromMessage('嫌いです')).toBe(0);
    });

    it('ポジティブキーワードを含むとき 1 以上を返す', () => {
      expect(getFavorabilityDeltaFromMessage('ありがとう')).toBeGreaterThanOrEqual(1);
      expect(getFavorabilityDeltaFromMessage('感謝しています')).toBeGreaterThanOrEqual(1);
      expect(getFavorabilityDeltaFromMessage('嬉しい')).toBeGreaterThanOrEqual(1);
    });

    it('通常の会話は 1 を返す（微増）', () => {
      expect(getFavorabilityDeltaFromMessage('今日は晴れ')).toBe(1);
      expect(getFavorabilityDeltaFromMessage('クエストやる')).toBe(1);
    });
  });

  describe('FAVORABILITY_BY_RARITY', () => {
    it('5段階のレアリティに対応した加算値を持つ', () => {
      expect(FAVORABILITY_BY_RARITY['common']).toBe(2);
      expect(FAVORABILITY_BY_RARITY['rare']).toBe(5);
      expect(FAVORABILITY_BY_RARITY['super-rare']).toBe(10);
      expect(FAVORABILITY_BY_RARITY['ultra-rare']).toBe(20);
      expect(FAVORABILITY_BY_RARITY['legend']).toBe(40);
    });
  });

  describe('constants', () => {
    it('FAVORABILITY_MAX と FAVORABILITY_MIN が定義されている', () => {
      expect(FAVORABILITY_MAX).toBe(1000);
      expect(FAVORABILITY_MIN).toBe(0);
    });
  });
});
