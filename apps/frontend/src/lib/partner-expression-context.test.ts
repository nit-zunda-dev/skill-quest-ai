/**
 * 文脈→表情マッピングの単体テスト（Task 2.1, Requirements 3.1–3.5）
 */
import { describe, it, expect } from 'vitest';
import {
  getExpressionFromContext,
  getExpressionFromLastAssistantContent,
  getExpressionForPartner,
  type PartnerDisplayContext,
} from '@/lib/partner-expression-context';

describe('partner-expression-context (Task 2.1)', () => {
  describe('getExpressionFromContext', () => {
    it('returns default for idle (待機)', () => {
      expect(getExpressionFromContext('idle')).toBe('default');
    });

    it('returns cheer for loading (送信中・応援)', () => {
      expect(getExpressionFromContext('loading')).toBe('cheer');
    });

    it('returns happy for success (達成・喜び)', () => {
      expect(getExpressionFromContext('success')).toBe('happy');
    });

    it('returns worried for retry (未達フォロー)', () => {
      expect(getExpressionFromContext('retry')).toBe('worried');
    });

    it('returns default for unknown context to keep safe fallback', () => {
      const unknown = 'unknown' as PartnerDisplayContext;
      expect(getExpressionFromContext(unknown)).toBe('default');
    });
  });

  describe('getExpressionFromLastAssistantContent', () => {
    it('returns worried for 心配・フォロー系', () => {
      expect(getExpressionFromLastAssistantContent('無理しないでね')).toBe('worried');
      expect(getExpressionFromLastAssistantContent('大丈夫？')).toBe('worried');
    });

    it('returns cheer for 応援・励まし系', () => {
      expect(getExpressionFromLastAssistantContent('頑張って！')).toBe('cheer');
      expect(getExpressionFromLastAssistantContent('一緒に乗り越えよう')).toBe('cheer');
    });

    it('returns happy for 喜び・祝福系', () => {
      expect(getExpressionFromLastAssistantContent('おめでとう！')).toBe('happy');
      expect(getExpressionFromLastAssistantContent('よかったね')).toBe('happy');
    });

    it('returns smile for 穏やか肯定系', () => {
      expect(getExpressionFromLastAssistantContent('そうだね')).toBe('smile');
      expect(getExpressionFromLastAssistantContent('いいね')).toBe('smile');
    });

    it('returns null for empty or no match', () => {
      expect(getExpressionFromLastAssistantContent('')).toBe(null);
      expect(getExpressionFromLastAssistantContent('   ')).toBe(null);
      expect(getExpressionFromLastAssistantContent('明日は晴れです')).toBe(null);
    });
  });

  describe('getExpressionForPartner', () => {
    it('returns cheer when isLoading', () => {
      expect(
        getExpressionForPartner({
          isLoading: true,
          messages: [{ role: 'assistant', content: 'おめでとう！' }],
        })
      ).toBe('cheer');
    });

    it('returns default when no messages', () => {
      expect(getExpressionForPartner({ isLoading: false, messages: [] })).toBe('default');
    });

    it('returns inferred expression from last assistant message (chat end keeps expression)', () => {
      expect(
        getExpressionForPartner({
          isLoading: false,
          messages: [
            { role: 'user', content: 'テスト' },
            { role: 'assistant', content: 'おめでとう！よくできたね。' },
          ],
        })
      ).toBe('happy');
      expect(
        getExpressionForPartner({
          isLoading: false,
          messages: [
            { role: 'user', content: '辛い' },
            { role: 'assistant', content: '大丈夫？無理しないで。' },
          ],
        })
      ).toBe('worried');
    });

    it('returns smile when messages exist but no keyword match', () => {
      expect(
        getExpressionForPartner({
          isLoading: false,
          messages: [
            { role: 'user', content: '天気は？' },
            { role: 'assistant', content: '明日は晴れの予報です。' },
          ],
        })
      ).toBe('smile');
    });
  });
});
