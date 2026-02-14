import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusPanel from './StatusPanel';
import { createTestCharacterProfile } from '../../../../tests/fixtures';

describe('StatusPanel', () => {
  it('キャラクター名を表示する', () => {
    const profile = createTestCharacterProfile({
      name: 'Test Character',
    });

    render(<StatusPanel profile={profile} />);

    expect(screen.getByText('Test Character')).toBeDefined();
  });

  it('クラス名とタイトルを表示する', () => {
    const profile = createTestCharacterProfile({
      className: 'Warrior',
      title: 'Brave Warrior',
    });

    render(<StatusPanel profile={profile} />);

    expect(screen.getByText('Warrior')).toBeDefined();
    expect(screen.getByText(/Brave Warrior/)).toBeDefined();
  });

  it('XP情報を表示する', () => {
    const profile = createTestCharacterProfile({
      level: 5,
      currentXp: 50,
      nextLevelXp: 100,
    });

    render(<StatusPanel profile={profile} />);

    expect(screen.getByText(/Lv\.5/)).toBeDefined();
    expect(screen.getByText(/50 \/ 100/)).toBeDefined();
  });

  it('ゴールド情報を表示する', () => {
    const profile = createTestCharacterProfile({
      gold: 1000,
    });

    render(<StatusPanel profile={profile} />);

    expect(screen.getByText(/1000 G/)).toBeDefined();
  });

  it('XPバーのパーセンテージを正しく計算する', () => {
    const profile = createTestCharacterProfile({
      currentXp: 50,
      nextLevelXp: 100,
    });

    const { container } = render(<StatusPanel profile={profile} />);
    const xpBar = container.querySelector('.bg-yellow-500');
    expect(xpBar).toBeDefined();
    expect(xpBar?.getAttribute('style')).toContain('width: 50%');
  });

  it('XPが上限を超えている場合でも100%を超えない', () => {
    const profile = createTestCharacterProfile({
      currentXp: 150,
      nextLevelXp: 100,
    });

    const { container } = render(<StatusPanel profile={profile} />);
    const xpBar = container.querySelector('.bg-yellow-500');
    expect(xpBar?.getAttribute('style')).toContain('width: 100%');
  });

  it('テーマカラーをアバターのボーダーに適用する', () => {
    const profile = createTestCharacterProfile({
      themeColor: '#ff0000',
    });

    const { container } = render(<StatusPanel profile={profile} />);
    const avatar = container.querySelector('.bg-slate-700');
    expect(avatar?.getAttribute('style')).toContain('border-color: rgb(255, 0, 0)');
  });

  it('ゼロのゴールドでも正しく表示する', () => {
    const profile = createTestCharacterProfile({
      gold: 0,
    });

    render(<StatusPanel profile={profile} />);

    expect(screen.getByText(/0 G/)).toBeDefined();
  });
});
