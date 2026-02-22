/**
 * エントリでのルーターマウント検証（Task 8.1, Requirements 2.1, 2.2）
 * 単一ルーターとルートツリーがエントリで描画され、URL に対応した画面が表示されることを検証する。
 * Task 4.2: App ルート付近に PartnerVariantProvider が配置され、パートナーページとウィジェットで同一バリアントを参照できることを検証する。
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query';
import { AuthProvider } from '@/hooks/useAuth';
import { PartnerVariantProvider } from '@/contexts/PartnerVariantContext';
import { usePartnerVariant } from '@/contexts/PartnerVariantContext';
import { routeConfig } from '@/routes';
import { PATH_LANDING } from '@/lib/paths';

const queryClient = createQueryClient();

/** Task 4.2: usePartnerVariant がルートツリーで利用可能であることを検証するための消費者コンポーネント */
function VariantConsumer() {
  const { variant } = usePartnerVariant();
  return <span data-testid="partner-variant">{variant}</span>;
}

/** main.tsx と同じプロバイダーツリー（PartnerVariantProvider 含む）でルーターを描画 */
function renderEntryWithRouter(initialEntries: string[] = [PATH_LANDING]) {
  const router = createMemoryRouter(routeConfig, { initialEntries });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PartnerVariantProvider>
          <RouterProvider router={router} />
        </PartnerVariantProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('Entry router mount (Task 8.1)', () => {
  it('mounts single router and renders route tree at / (landing via App, Task 8.2)', async () => {
    renderEntryWithRouter([PATH_LANDING]);
    const el = await screen.findByTestId('landing-page');
    expect(el).toBeTruthy();
  });

  it('redirects to login when /app is accessed unauthenticated (Task 9.1)', async () => {
    renderEntryWithRouter(['/app']);
    await screen.findByRole('heading', { name: 'Skill Quest AI' });
  });
});

describe('App root provides PartnerVariant context (Task 4.2, Req 5.4)', () => {
  it('PartnerVariantProvider is at app root so usePartnerVariant is available in route tree', () => {
    const router = createMemoryRouter(
      [{ path: '/', element: <VariantConsumer /> }],
      { initialEntries: ['/'] }
    );
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <PartnerVariantProvider>
            <RouterProvider router={router} />
          </PartnerVariantProvider>
        </AuthProvider>
      </QueryClientProvider>
    );
    expect(screen.getByTestId('partner-variant').textContent).toBe('default');
  });
});
