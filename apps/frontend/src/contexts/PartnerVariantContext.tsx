/**
 * パートナーバリアントの state と localStorage 同期（Task 4.1, Requirements 5.1, 5.2, 5.4）
 * 未設定時は default。localStorage が利用できない環境ではメモリ上の default のみで動作する。
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { PartnerVariant } from '@/lib/partner-assets';

export const PARTNER_VARIANT_STORAGE_KEY = 'skill-quest:partnerVariant';

const VALID_VARIANTS: PartnerVariant[] = ['default', 'male'];

function parseStoredVariant(raw: string | null): PartnerVariant {
  if (raw === null) return 'default';
  return VALID_VARIANTS.includes(raw as PartnerVariant) ? (raw as PartnerVariant) : 'default';
}

function readVariantFromStorage(): PartnerVariant {
  try {
    if (typeof localStorage === 'undefined') return 'default';
    const raw = localStorage.getItem(PARTNER_VARIANT_STORAGE_KEY);
    return parseStoredVariant(raw);
  } catch {
    return 'default';
  }
}

interface PartnerVariantContextValue {
  variant: PartnerVariant;
  setVariant: (v: PartnerVariant) => void;
}

const PartnerVariantContext = createContext<PartnerVariantContextValue | null>(null);

export function PartnerVariantProvider({ children }: { children: React.ReactNode }) {
  const [variant, setVariantState] = useState<PartnerVariant>(readVariantFromStorage);

  const setVariant = useCallback((v: PartnerVariant) => {
    setVariantState(v);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(PARTNER_VARIANT_STORAGE_KEY, v);
      }
    } catch {
      // メモリ上のみで動作させる（プライベートモード等）
    }
  }, []);

  const value: PartnerVariantContextValue = { variant, setVariant };
  return (
    <PartnerVariantContext.Provider value={value}>
      {children}
    </PartnerVariantContext.Provider>
  );
}

export function usePartnerVariant(): PartnerVariantContextValue {
  const ctx = useContext(PartnerVariantContext);
  if (!ctx) {
    throw new Error('usePartnerVariant must be used within PartnerVariantProvider');
  }
  return ctx;
}
