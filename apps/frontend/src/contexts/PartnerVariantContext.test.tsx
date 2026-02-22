/**
 * バリアント Provider と usePartnerVariant の単体テスト（Task 4.1, 7.2）
 * - 初期読み込みが localStorage から行われること
 * - setVariant 時に localStorage に保存されること
 * - 未設定時は default であること
 * - localStorage 利用不可時はメモリ上の default のみで動作すること
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import React from 'react';
import {
  PartnerVariantProvider,
  usePartnerVariant,
  PARTNER_VARIANT_STORAGE_KEY,
} from './PartnerVariantContext';
import type { PartnerVariant } from '@/lib/partner-assets';

describe('PartnerVariantContext (Task 4.1, 7.2)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <PartnerVariantProvider>{children}</PartnerVariantProvider>
  );

  describe('initial load', () => {
    it('returns default when localStorage is empty', () => {
      const { result } = renderHook(() => usePartnerVariant(), { wrapper });
      expect(result.current.variant).toBe('default');
    });

    it('returns value from localStorage when key exists with valid variant', () => {
      localStorage.setItem(PARTNER_VARIANT_STORAGE_KEY, 'male');
      const { result } = renderHook(() => usePartnerVariant(), { wrapper });
      expect(result.current.variant).toBe('male');
    });

    it('returns default when localStorage has invalid value', () => {
      localStorage.setItem(PARTNER_VARIANT_STORAGE_KEY, 'invalid');
      const { result } = renderHook(() => usePartnerVariant(), { wrapper });
      expect(result.current.variant).toBe('default');
    });
  });

  describe('setVariant', () => {
    it('updates variant and persists to localStorage', () => {
      const { result } = renderHook(() => usePartnerVariant(), { wrapper });
      expect(result.current.variant).toBe('default');
      expect(localStorage.getItem(PARTNER_VARIANT_STORAGE_KEY)).toBeNull();

      act(() => {
        result.current.setVariant('male');
      });
      expect(result.current.variant).toBe('male');
      expect(localStorage.getItem(PARTNER_VARIANT_STORAGE_KEY)).toBe('male');

      act(() => {
        result.current.setVariant('default');
      });
      expect(result.current.variant).toBe('default');
      expect(localStorage.getItem(PARTNER_VARIANT_STORAGE_KEY)).toBe('default');
    });
  });

  describe('localStorage unavailable', () => {
    it('returns default and setVariant updates in-memory only when getItem throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage disabled');
      });
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('localStorage disabled');
      });

      const { result } = renderHook(() => usePartnerVariant(), { wrapper });
      expect(result.current.variant).toBe('default');

      act(() => {
        result.current.setVariant('male');
      });
      expect(result.current.variant).toBe('male');
      vi.restoreAllMocks();
      expect(localStorage.getItem(PARTNER_VARIANT_STORAGE_KEY)).toBeNull();
    });

    it('setVariant does not throw when setItem throws (in-memory still updates)', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockReturnValue(null);
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('QuotaExceeded');
      });

      const { result } = renderHook(() => usePartnerVariant(), { wrapper });
      expect(() => {
        act(() => {
          result.current.setVariant('male');
        });
      }).not.toThrow();
      expect(result.current.variant).toBe('male');
    });
  });

  describe('usePartnerVariant outside Provider', () => {
    it('throws when used outside PartnerVariantProvider', () => {
      expect(() => renderHook(() => usePartnerVariant())).toThrow(
        /usePartnerVariant must be used within PartnerVariantProvider/
      );
    });
  });
});
