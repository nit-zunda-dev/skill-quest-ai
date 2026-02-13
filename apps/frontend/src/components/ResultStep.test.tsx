import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ResultStep from './ResultStep';
import { createTestCharacterProfile } from '../../../../tests/fixtures';

describe('ResultStep', () => {
  it('プロフィール情報を正しく表示する', () => {
    const profile = createTestCharacterProfile({
      className: 'Warrior',
      title: 'Brave Warrior',
      prologue: 'This is a test prologue.',
    });
    const onComplete = vi.fn();

    render(<ResultStep profile={profile} onComplete={onComplete} />);

    expect(screen.getByText('キャラクター作成完了')).toBeDefined();
    expect(screen.getByText('Warrior')).toBeDefined();
    expect(screen.getByText('Brave Warrior')).toBeDefined();
    expect(screen.getByText(/This is a test prologue/)).toBeDefined();
  });

  it('「世界へ旅立つ」ボタンを表示する', () => {
    const profile = createTestCharacterProfile();
    const onComplete = vi.fn();

    render(<ResultStep profile={profile} onComplete={onComplete} />);

    const button = screen.getByRole('button', { name: /世界へ旅立つ/ });
    expect(button).toBeDefined();
  });

  it('「世界へ旅立つ」ボタンをクリックするとonCompleteが呼ばれる', () => {
    const profile = createTestCharacterProfile();
    const onComplete = vi.fn();

    render(<ResultStep profile={profile} onComplete={onComplete} />);

    const button = screen.getByRole('button', { name: /世界へ旅立つ/ });
    button.click();

    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('プロローグセクションを表示する', () => {
    const profile = createTestCharacterProfile({
      prologue: 'A long prologue text that should be displayed.',
    });
    const onComplete = vi.fn();

    render(<ResultStep profile={profile} onComplete={onComplete} />);

    expect(screen.getByText('プロローグ')).toBeDefined();
    expect(screen.getByText(/A long prologue text/)).toBeDefined();
  });

  it('異なるプロフィール情報でも正しく表示する', () => {
    const profile = createTestCharacterProfile({
      className: 'Mage',
      title: 'Wise Mage',
      prologue: 'Magic flows through me.',
    });
    const onComplete = vi.fn();

    render(<ResultStep profile={profile} onComplete={onComplete} />);

    expect(screen.getByText('Mage')).toBeDefined();
    expect(screen.getByText('Wise Mage')).toBeDefined();
    expect(screen.getByText(/Magic flows through me/)).toBeDefined();
  });
});
