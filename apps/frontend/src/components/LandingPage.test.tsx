/**
 * LandingPage のテスト（Task 4.1, 5.1）
 * - ヒーローに価値が短時間で伝わる見出しとコピー、プライマリ CTA が 1 つある
 * - プライマリ CTA クリックで onStartClick が 1 回呼ばれる
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LandingPage from './LandingPage';

describe('LandingPage (Task 4.1, 5.1)', () => {
  const onStartClick = vi.fn();

  beforeEach(() => {
    onStartClick.mockClear();
  });

  it('renders a hero (first-view) with value-communicating headline and copy', () => {
    render(<LandingPage onStartClick={onStartClick} />);
    const hero = screen.getByRole('region', { name: /ヒーロー|hero/i });
    expect(hero).toBeTruthy();
    const heading = hero.querySelector('h1');
    expect(heading).toBeTruthy();
    expect(heading?.textContent?.length).toBeGreaterThan(0);
    const copy = hero.querySelector('p');
    expect(copy).toBeTruthy();
    expect(screen.getByRole('button', { name: /始める/ })).toBeTruthy();
  });

  it('calls onStartClick exactly once when primary CTA is clicked', () => {
    render(<LandingPage onStartClick={onStartClick} />);
    const cta = screen.getByRole('button', { name: /冒険を始める/ });
    fireEvent.click(cta);
    expect(onStartClick).toHaveBeenCalledTimes(1);
    fireEvent.click(cta);
    expect(onStartClick).toHaveBeenCalledTimes(2);
  });
});
