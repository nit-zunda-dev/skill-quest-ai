/**
 * 認証済み・Genesis 完了後のダッシュボード用レイアウト（Task 9.1, 10.2, 13.1, Requirements 1.1, 2.1, 4.3, 3.4）
 * RequireAuth と RequireGenesis の内側で使用。location.state に fromGenesis と profile がある場合は
 * そのプロフィールで即時表示し、リロード時は useGenesisOrProfile で取得する。ルート別メタを適用する。
 */
import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { PageMeta } from '@/components/PageMeta';
import { ProfileProvider } from '@/contexts/ProfileContext';
import AppLayout from '@/layouts/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useGenesisOrProfile } from '@/hooks/useGenesisOrProfile';
import { normalizeProfileNumbers } from '@/lib/api-client';
import { PATH_APP } from '@/lib/paths';
import { getRouteMeta } from '@/lib/route-meta';
import type { CharacterProfile } from '@skill-quest/shared';

export function DashboardLayout() {
  const location = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const state = useGenesisOrProfile({ isAuthenticated, isLoading: authLoading });

  const fromGenesisState =
    location.state &&
    typeof location.state === 'object' &&
    'fromGenesis' in location.state &&
    (location.state as { fromGenesis?: boolean }).fromGenesis === true &&
    'profile' in location.state;

  const stateProfile =
    fromGenesisState && (location.state as { profile?: CharacterProfile }).profile;

  if (stateProfile != null) {
    const profile = normalizeProfileNumbers(stateProfile);
    return (
      <PageMeta {...getRouteMeta(PATH_APP)}>
        <ProfileProvider initialProfile={profile}>
          <div data-worldview={profile.worldviewId}>
            <AppLayout>
              <Outlet />
            </AppLayout>
          </div>
        </ProfileProvider>
      </PageMeta>
    );
  }

  if (state.kind === 'loading') {
    return (
      <div className="app-root min-h-screen bg-background text-foreground flex items-center justify-center" data-worldview="arcane-terminal">
        <div className="text-muted-foreground animate-pulse">読み込み中...</div>
      </div>
    );
  }

  if (state.kind !== 'dashboard') {
    return null;
  }

  const profile = normalizeProfileNumbers(state.profile);
  return (
    <PageMeta {...getRouteMeta(PATH_APP)}>
      <ProfileProvider initialProfile={profile}>
        <div data-worldview={profile.worldviewId}>
          <AppLayout>
            <Outlet />
          </AppLayout>
        </div>
      </ProfileProvider>
    </PageMeta>
  );
}
