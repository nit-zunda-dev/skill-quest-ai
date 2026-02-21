/**
 * usePageMeta の単体テスト（Task 7.1, Requirements 3.1, 3.2, 3.4）
 * ルート別の title・description・noindex を document に設定する仕組みを検証する。
 */
import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { usePageMeta } from './usePageMeta';

function getDescriptionContent(): string | null {
  const el = document.querySelector('meta[name="description"]');
  return el?.getAttribute('content') ?? null;
}

function getRobotsContent(): string | null {
  const el = document.querySelector('meta[name="robots"]');
  return el?.getAttribute('content') ?? null;
}

function TestSubject({ title, description, noindex }: { title: string; description?: string; noindex?: boolean }) {
  usePageMeta({ title, description, noindex });
  return null;
}

describe('usePageMeta (Task 7.1)', () => {
  const initialTitle = document.title;

  afterEach(() => {
    document.title = initialTitle;
    document.querySelector('meta[name="description"]')?.remove();
    document.querySelector('meta[name="robots"]')?.remove();
  });

  it('sets document.title when meta.title is provided', () => {
    render(<TestSubject title="Test Title" />);
    expect(document.title).toBe('Test Title');
  });

  it('sets meta name="description" when meta.description is provided', () => {
    render(<TestSubject title="T" description="Test description" />);
    expect(getDescriptionContent()).toBe('Test description');
  });

  it('sets meta name="robots" content="noindex, nofollow" when meta.noindex is true', () => {
    render(<TestSubject title="T" noindex />);
    expect(getRobotsContent()).toBe('noindex, nofollow');
  });

  it('updates document and meta when props change', () => {
    const { rerender } = render(<TestSubject title="First" description="First desc" />);
    expect(document.title).toBe('First');
    expect(getDescriptionContent()).toBe('First desc');

    rerender(<TestSubject title="Second" description="Second desc" noindex />);
    expect(document.title).toBe('Second');
    expect(getDescriptionContent()).toBe('Second desc');
    expect(getRobotsContent()).toBe('noindex, nofollow');
  });
});
