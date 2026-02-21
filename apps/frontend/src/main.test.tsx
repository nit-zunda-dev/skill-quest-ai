/**
 * エントリでのルーターマウント検証（Task 8.1, Requirements 2.1, 2.2）
 * 単一ルーターとルートツリーがエントリで描画され、URL に対応した画面が表示されることを検証する。
 */
import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { createQueryClient } from '@/lib/query';
import { AuthProvider } from '@/hooks/useAuth';
import { routeConfig } from '@/routes';
import { PATH_LANDING } from '@/lib/paths';

const queryClient = createQueryClient();

function renderEntryWithRouter(initialEntries: string[] = [PATH_LANDING]) {
  const router = createMemoryRouter(routeConfig, { initialEntries });
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

describe('Entry router mount (Task 8.1)', () => {
  it('mounts single router and renders route tree at / (landing placeholder)', async () => {
    renderEntryWithRouter([PATH_LANDING]);
    const el = await screen.findByTestId('route-placeholder-Landing');
    expect(el).toBeTruthy();
  });

  it('renders route tree at /app (dashboard placeholder) when navigated', async () => {
    renderEntryWithRouter(['/app']);
    const el = await screen.findByTestId('route-placeholder-AppLayout');
    expect(el).toBeTruthy();
  });
});
