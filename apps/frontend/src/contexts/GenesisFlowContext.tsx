/**
 * Genesis フロー用コンテキスト（Task 10.1）
 * ステップ間で formData と profile を保持し、URL 遷移・戻る/進むで復元する。
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { CharacterProfile, GenesisFormData } from '@skill-quest/shared';

interface GenesisFlowContextValue {
  formData: GenesisFormData;
  setFormData: React.Dispatch<React.SetStateAction<GenesisFormData>>;
  profile: CharacterProfile | null;
  setProfile: (p: CharacterProfile | null) => void;
}

const GenesisFlowContext = createContext<GenesisFlowContextValue | null>(null);

const initialFormData: GenesisFormData = { name: '', goal: '' };

export function GenesisFlowProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<GenesisFormData>(initialFormData);
  const [profile, setProfile] = useState<CharacterProfile | null>(null);
  const value: GenesisFlowContextValue = {
    formData,
    setFormData,
    profile,
    setProfile: useCallback((p: CharacterProfile | null) => setProfile(p), []),
  };
  return (
    <GenesisFlowContext.Provider value={value}>
      {children}
    </GenesisFlowContext.Provider>
  );
}

export function useGenesisFlow(): GenesisFlowContextValue {
  const ctx = useContext(GenesisFlowContext);
  if (!ctx) throw new Error('useGenesisFlow must be used within GenesisFlowProvider');
  return ctx;
}
