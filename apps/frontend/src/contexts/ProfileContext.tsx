/**
 * 認証済みアプリ全体でプロフィールを共有する Context。
 * ナラティブ完了・グリモワール生成でプロフィールが更新されたら setProfile で更新する。
 */
import React, { createContext, useContext, useState, useCallback } from 'react';
import type { CharacterProfile } from '@skill-quest/shared';

interface ProfileContextValue {
  profile: CharacterProfile;
  setProfile: (profile: CharacterProfile | ((prev: CharacterProfile) => CharacterProfile)) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({
  initialProfile,
  children,
}: {
  initialProfile: CharacterProfile;
  children: React.ReactNode;
}) {
  const [profile, setProfileState] = useState<CharacterProfile>(initialProfile);
  const setProfile = useCallback(
    (updater: CharacterProfile | ((prev: CharacterProfile) => CharacterProfile)) => {
      setProfileState(updater);
    },
    []
  );
  const value: ProfileContextValue = { profile, setProfile };
  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
