/**
 * 獲得アイテムページのテスト（Task 6.1）
 * - 所持一覧 API を呼び出して一覧表示する
 * - 空の場合はメッセージ、取得済みの場合は名前・画像パスで表示する
 */
/// <reference types="vitest" />
// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React from 'react';
import ItemsPage from './ItemsPage';
import { Category, Rarity } from '@skill-quest/shared';

const mockGetAcquiredItems = vi.fn();
const mockGetItemMaster = vi.fn();

vi.mock('@/lib/api-client', () => ({
  getAcquiredItems: () => mockGetAcquiredItems(),
  getItemMaster: () => mockGetItemMaster(),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
}

describe('ItemsPage (Task 6.1)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('タイトル「獲得アイテム」を表示する', async () => {
    mockGetAcquiredItems.mockResolvedValue([]);
    mockGetItemMaster.mockResolvedValue([]);
    render(<ItemsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('獲得アイテム')).toBeDefined();
    });
  });

  it('マスタが空のときメッセージを表示する', async () => {
    mockGetAcquiredItems.mockResolvedValue([]);
    mockGetItemMaster.mockResolvedValue([]);
    render(<ItemsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText(/まだアイテムはありません/)).toBeDefined();
    });
    expect(screen.getByText(/タスクをクリアすると/)).toBeDefined();
  });

  it('所持済みアイテムは名前・画像、未所持は ? で表示する', async () => {
    const masterList = [
      { id: 'drink-common-01', name: 'ナノバナナ', category: Category.DRINK, rarity: Rarity.COMMON },
      { id: 'chip-rare-01', name: 'シークレットチップ', category: Category.CHIP, rarity: Rarity.RARE },
    ];
    mockGetItemMaster.mockResolvedValue(masterList);
    mockGetAcquiredItems.mockResolvedValue([
      {
        itemId: 'drink-common-01',
        acquiredAt: '2025-02-23T12:00:00.000Z',
        name: 'ナノバナナ',
        category: Category.DRINK,
        rarity: Rarity.COMMON,
      },
    ]);
    render(<ItemsPage />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('ナノバナナ')).toBeDefined();
    });
    const img = screen.getByRole('img', { name: /ナノバナナ/ });
    expect(img.getAttribute('src')).toBe('/images/items/drink/drink-common-01.png');
    expect(screen.getByText('？？？')).toBeDefined();
    expect(screen.getByText('未獲得')).toBeDefined();
    expect(screen.getByText(/1 \/ 2 コレクト/)).toBeDefined();
  });
});
