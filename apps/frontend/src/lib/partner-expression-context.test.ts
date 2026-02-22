/**
 * 文脈→表情マッピングの単体テスト（Task 2.1, Requirements 3.1–3.5）
 */
import { describe, it, expect } from 'vitest';
import {
  getExpressionFromContext,
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
});
