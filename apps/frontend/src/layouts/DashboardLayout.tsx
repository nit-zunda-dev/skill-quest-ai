/**
 * 認証済み・Genesis 完了後のダッシュボード用レイアウト（Task 9.1, Requirements 1.1, 2.1）
 * RequireAuth と RequireGenesis の内側で使用し、ProfileProvider + AppLayout + Outlet を描画する。
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import { ProfileProvider } from '@/contexts/ProfileContext';
import AppLayout from '@/layouts/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useGenesisOrProfile } from '@/hooks/useGenesisOrProfile';
import { normalizeProfileNumbers } from '@/lib/api-client';

export function DashboardLayout() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const state = useGenesisOrProfile({ isAuthenticated, isLoading: authLoading });

  if (state.kind === 'loading') {
    return (
      <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 text-slate-200 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">読み込み中...</div>
      </div>
    );
  }

  if (state.kind !== 'dashboard') {
    return null;
  }

  const profile = normalizeProfileNumbers(state.profile);
  return (
    <ProfileProvider initialProfile={profile}>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProfileProvider>
  );
}
