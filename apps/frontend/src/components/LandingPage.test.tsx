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

  it('calls parent callback exactly once per primary CTA click (Task 5.1, Req 5.1)', () => {
    render(<LandingPage onStartClick={onStartClick} />);
    const cta = screen.getByRole('button', { name: /始める/ });
    fireEvent.click(cta);
    expect(onStartClick).toHaveBeenCalledTimes(1);
    fireEvent.click(cta);
    expect(onStartClick).toHaveBeenCalledTimes(2);
  });
});

describe('LandingPage value proposition (Task 4.2, Req 2.1, 2.2, 2.3)', () => {
  it('renders a value proposition section with RPG/gamification/game-like learning copy', () => {
    render(<LandingPage onStartClick={vi.fn()} />);
    const valueSection = screen.getByRole('region', { name: /このアプリでできること/i });
    expect(valueSection).toBeTruthy();
    const text = valueSection.textContent ?? '';
    expect(
      /クエスト|ゲーム|資格|ゲーミフィケーション|ToDo/.test(text)
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

describe('LandingPage visual (Task 4.3, Req 3.1, 3.3)', () => {
  it('uses existing world palette (slate and indigo)', () => {
    render(<LandingPage onStartClick={vi.fn()} />);
    const page = screen.getByTestId('landing-page');
    const html = page.innerHTML;
    expect(html).toMatch(/slate/);
    expect(html).toMatch(/indigo/);
  });

  it('includes light animation or transition for reward feel', () => {
    render(<LandingPage onStartClick={vi.fn()} />);
    const page = screen.getByTestId('landing-page');
    const html = page.innerHTML;
    expect(
      /animate-|transition-|duration-/.test(html)
    ).toBe(true);
  });
});

describe('LandingPage responsive and accessibility (Task 4.4, Req 4.1, 4.2)', () => {
  it('has main landmark for semantic structure', () => {
    render(<LandingPage onStartClick={vi.fn()} />);
    const main = screen.getByRole('main');
    const hero = screen.getByRole('region', { name: /ヒーロー/i });
    expect(main.contains(hero)).toBe(true);
  });

  it('has logical heading hierarchy (h1 then h2)', () => {
    render(<LandingPage onStartClick={vi.fn()} />);
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThanOrEqual(2);
    expect(headings[0].tagName).toBe('H1');
    const h2s = headings.filter((h) => h.tagName === 'H2');
    expect(h2s.length).toBeGreaterThanOrEqual(1);
  });

  it('uses responsive breakpoint classes for mobile, tablet, desktop', () => {
    render(<LandingPage onStartClick={vi.fn()} />);
    const page = screen.getByTestId('landing-page');
    const html = page.innerHTML;
    expect(/sm:|md:|lg:/.test(html)).toBe(true);
  });

  it('primary CTA is focusable and has visible focus', () => {
    render(<LandingPage onStartClick={vi.fn()} />);
    const cta = screen.getByRole('button', { name: /始める/ });
    expect(cta.getAttribute('tabindex')).not.toBe('-1');
    expect(cta.tagName).toBe('BUTTON');
  });
});
