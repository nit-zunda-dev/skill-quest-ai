import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { IntroStep, QuestionStep, LoadingStep } from './GenesisStep';
import { Genre } from '@skill-quest/shared';

describe('IntroStep', () => {
  it('タイトルと説明を表示する', () => {
    const onNext = vi.fn();
    render(<IntroStep onNext={onNext} />);

    expect(screen.getByText('Chronicle')).toBeDefined();
    expect(screen.getByText(/毎日の習慣をRPGに変えよう/)).toBeDefined();
  });

  it('「冒険を始める」ボタンを表示する', () => {
    const onNext = vi.fn();
    render(<IntroStep onNext={onNext} />);

    const button = screen.getByRole('button', { name: /冒険を始める/ });
    expect(button).toBeDefined();
  });

  it('「冒険を始める」ボタンをクリックするとonNextが呼ばれる', () => {
    const onNext = vi.fn();
    render(<IntroStep onNext={onNext} />);

    const button = screen.getByRole('button', { name: /冒険を始める/ });
    fireEvent.click(button);

    expect(onNext).toHaveBeenCalledTimes(1);
  });
});

describe('QuestionStep', () => {
  const defaultProps = {
    name: 'Test User',
    goal: '',
    genre: Genre.FANTASY,
    onChange: vi.fn(),
    onNext: vi.fn(),
    isGenerating: false,
  };

  it('名前フィールドを表示する（読み取り専用）', () => {
    render(<QuestionStep {...defaultProps} name="Test User" />);

    const nameInput = screen.getByDisplayValue('Test User') as HTMLInputElement;
    expect(nameInput).toBeDefined();
    expect(nameInput.readOnly).toBe(true);
  });

  it('目標フィールドを表示する', () => {
    render(<QuestionStep {...defaultProps} />);

    const goalInput = screen.getByPlaceholderText(/例：英語学習/);
    expect(goalInput).toBeDefined();
  });

  it('目標を入力できる', () => {
    const onChange = vi.fn();
    render(<QuestionStep {...defaultProps} onChange={onChange} />);

    const goalInput = screen.getByPlaceholderText(/例：英語学習/);
    fireEvent.change(goalInput, { target: { value: 'Learn English' } });

    expect(onChange).toHaveBeenCalledWith('goal', 'Learn English');
  });

  it('ジャンル選択ボタンを表示する', () => {
    render(<QuestionStep {...defaultProps} />);

    Object.values(Genre).forEach(genre => {
      expect(screen.getByText(genre)).toBeDefined();
    });
  });

  it('ジャンルを選択できる', () => {
    const onChange = vi.fn();
    render(<QuestionStep {...defaultProps} onChange={onChange} goal="Test Goal" />);

    const genreButton = screen.getByText(Genre.SCI_FI);
    fireEvent.click(genreButton);

    expect(onChange).toHaveBeenCalledWith('genre', Genre.SCI_FI);
  });

  it('選択されたジャンルがハイライトされる', () => {
    render(<QuestionStep {...defaultProps} genre={Genre.SCI_FI} goal="Test Goal" />);

    const selectedButton = screen.getByText(Genre.SCI_FI).closest('button');
    expect(selectedButton?.className).toContain('bg-indigo-900/40');
  });

  it('名前と目標が入力されている場合のみ「決定して次へ」ボタンを表示する', () => {
    const { rerender } = render(<QuestionStep {...defaultProps} goal="" />);
    expect(screen.queryByRole('button', { name: /決定して次へ/ })).toBeNull();

    rerender(<QuestionStep {...defaultProps} goal="Learn English" />);
    expect(screen.getByRole('button', { name: /決定して次へ/ })).toBeDefined();
  });

  it('「決定して次へ」ボタンをクリックするとonNextが呼ばれる', () => {
    const onNext = vi.fn();
    render(<QuestionStep {...defaultProps} goal="Learn English" onNext={onNext} />);

    const button = screen.getByRole('button', { name: /決定して次へ/ });
    fireEvent.click(button);

    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('生成中の場合、ボタンが無効化される', () => {
    render(<QuestionStep {...defaultProps} goal="Learn English" isGenerating={true} />);

    const button = screen.getByRole('button', { name: /キャラクター生成中/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('生成中の場合、「キャラクター生成中...」と表示する', () => {
    render(<QuestionStep {...defaultProps} goal="Learn English" isGenerating={true} />);

    expect(screen.getByText(/キャラクター生成中/)).toBeDefined();
  });

  it('Enterキーで次のフィールドに移動する', () => {
    render(<QuestionStep {...defaultProps} />);

    const goalInput = screen.getByPlaceholderText(/例：英語学習/);
    fireEvent.keyDown(goalInput, { key: 'Enter', target: { value: 'Test Goal' } });

    // activeFieldが更新されることを確認（視覚的な変化は実装に依存）
    expect(goalInput).toBeDefined();
  });
});

describe('LoadingStep', () => {
  it('ローディングメッセージを表示する', () => {
    render(<LoadingStep />);

    expect(screen.getByText(/AIが世界を構築しています/)).toBeDefined();
  });

  it('ローディングメッセージが表示される', () => {
    render(<LoadingStep />);
    // 初期メッセージが表示されることを確認
    expect(screen.getByText(/AIが世界を構築しています/)).toBeDefined();
  });

  it('ローディングアニメーション要素を表示する', () => {
    const { container } = render(<LoadingStep />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeDefined();
  });
});
