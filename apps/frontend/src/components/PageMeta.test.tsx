/**
 * PageMeta コンポーネントの単体テスト（Task 7.1, Requirements 3.1, 3.2, 3.4）
 * ルート描画時に title・description・noindex を適用することを検証する。
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageMeta } from './PageMeta';

function getDescriptionContent(): string | null {
  const el = document.querySelector('meta[name="description"]');
  return el?.getAttribute('content') ?? null;
}

function getRobotsContent(): string | null {
  const el = document.querySelector('meta[name="robots"]');
  return el?.getAttribute('content') ?? null;
}

describe('PageMeta (Task 7.1)', () => {
  const initialTitle = document.title;

  afterEach(() => {
    document.title = initialTitle;
    document.querySelector('meta[name="description"]')?.remove();
    document.querySelector('meta[name="robots"]')?.remove();
  });

  it('sets document.title and does not render visible content when no children', () => {
    const { container } = render(<PageMeta title="Page Title" />);
    expect(document.title).toBe('Page Title');
    expect(container.textContent).toBe('');
  });

  it('sets description meta when description prop is provided', () => {
    render(<PageMeta title="T" description="Page description" />);
    expect(getDescriptionContent()).toBe('Page description');
  });

  it('sets robots noindex when noindex prop is true', () => {
    render(<PageMeta title="T" noindex />);
    expect(getRobotsContent()).toBe('noindex, nofollow');
  });

  it('renders children when provided', () => {
    render(
      <PageMeta title="T">
        <span data-testid="child">Child</span>
      </PageMeta>
    );
    expect(screen.getByTestId('child')).toBeTruthy();
    expect(screen.getByText('Child')).toBeTruthy();
  });
});
