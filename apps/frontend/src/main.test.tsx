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

describe('Entry router mount', () => {
  it('renders landing at /', async () => {
    renderEntryWithRouter([PATH_LANDING]);
    expect(await screen.findByTestId('landing-page')).toBeTruthy();
  });
});
