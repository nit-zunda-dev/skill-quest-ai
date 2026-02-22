/**
 * パートナー画像パス組み立ての単体テスト（Task 1.1, Requirements 1.1–1.4, 6.3）
 */
import { describe, it, expect } from 'vitest';
import {
  PARTNER_BASE_PATH,
  getPartnerImagePath,
  type PartnerVariant,
  type PartnerExpression,
} from '@/lib/partner-assets';

describe('partner-assets (Task 1.1)', () => {
  describe('PARTNER_BASE_PATH', () => {
    it('is /images/partner', () => {
      expect(PARTNER_BASE_PATH).toBe('/images/partner');
    });
  });

  describe('getPartnerImagePath', () => {
    it('returns path for default variant and standing', () => {
      expect(getPartnerImagePath('default', 'standing')).toBe(
        '/images/partner/default/standing.png'
      );
    });

    it('returns path for male variant and standing', () => {
      expect(getPartnerImagePath('male', 'standing')).toBe(
        '/images/partner/male/standing.png'
      );
    });

    it('returns expression-default.png for default expression', () => {
      expect(getPartnerImagePath('default', 'default')).toBe(
        '/images/partner/default/expression-default.png'
      );
    });

    it('returns expression-smile.png for smile expression', () => {
      expect(getPartnerImagePath('default', 'smile')).toBe(
        '/images/partner/default/expression-smile.png'
      );
    });

    it('returns expression-cheer.png for cheer expression', () => {
      expect(getPartnerImagePath('default', 'cheer')).toBe(
        '/images/partner/default/expression-cheer.png'
      );
    });

    it('returns expression-happy.png for happy expression', () => {
      expect(getPartnerImagePath('default', 'happy')).toBe(
        '/images/partner/default/expression-happy.png'
      );
    });

    it('returns expression-worried.png for worried expression', () => {
      expect(getPartnerImagePath('default', 'worried')).toBe(
        '/images/partner/default/expression-worried.png'
      );
    });

    it('builds path with variant so same variant gives consistent character', () => {
      expect(getPartnerImagePath('male', 'happy')).toBe(
        '/images/partner/male/expression-happy.png'
      );
      expect(getPartnerImagePath('male', 'standing')).toBe(
        '/images/partner/male/standing.png'
      );
    });

    it('falls back to default variant when invalid variant is passed (Req 6.3)', () => {
      const invalidVariant = 'invalid' as PartnerVariant;
      const path = getPartnerImagePath(invalidVariant, 'standing');
      expect(path).toContain('/default/');
      expect(path).toBe('/images/partner/default/standing.png');
    });
  });
});
