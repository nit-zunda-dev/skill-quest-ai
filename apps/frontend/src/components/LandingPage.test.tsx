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

describe('LandingPage value proposition (Task 4.2, Req 2.1, 2.2, 2.3)', () => {
  it('renders a value proposition section with RPG/gamification/game-like learning copy', () => {
    render(<LandingPage onStartClick={vi.fn()} />);
    const valueSection = screen.getByRole('region', { name: /価値提案|value/i });
    expect(valueSection).toBeTruthy();
    const text = valueSection.textContent ?? '';
    expect(
      /クエスト|ゲーム|自己研鑽|資格|ゲーミフィケーション|ToDo/.test(text)
    ).toBe(true);
  });

  it('uses encouraging tone (no self-blame); motivation copy is positive', () => {
    render(<LandingPage onStartClick={vi.fn()} />);
    const page = screen.getByTestId('landing-page');
    const fullText = page.textContent ?? '';
    expect(fullText).not.toMatch(/続かないあなた|怠け|だらしな/);
    expect(
      /続け|楽しく|ゲーム|クエスト|応援|一緒|前向き/.test(fullText)
    ).toBe(true);
  });
});
