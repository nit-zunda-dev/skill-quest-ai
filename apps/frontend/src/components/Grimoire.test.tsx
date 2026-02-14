import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Grimoire from './Grimoire';
import { createTestGrimoireEntry } from '../../../../tests/fixtures';

// フックをモック
const mockGenerateGrimoire = vi.fn();
const mockUseGrimoire = vi.fn(() => ({
  generateGrimoire: mockGenerateGrimoire,
  isGenerating: false,
  generateError: null,
}));

const mockUseAiUsage = vi.fn(() => ({
  canGenerateGrimoire: true,
  grimoireRemaining: 1,
  isLoading: false,
}));

vi.mock('@/hooks/useGrimoire', () => ({
  useGrimoire: () => mockUseGrimoire(),
}));

vi.mock('@/hooks/useAiUsage', () => ({
  useAiUsage: () => mockUseAiUsage(),
}));

describe('Grimoire', () => {
  const defaultProps = {
    entries: [],
    onGenerate: undefined,
    isGenerating: undefined,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('タイトルを表示する', () => {
    render(<Grimoire {...defaultProps} />);
    expect(screen.getByText(/グリモワール \(冒険の記録\)/)).toBeDefined();
  });

  it('エントリがない場合に空のメッセージを表示する', () => {
    render(<Grimoire {...defaultProps} entries={[]} />);
    expect(screen.getByText(/まだ物語は始まっていません/)).toBeDefined();
  });

  it('グリモワールエントリを表示する', () => {
    const entries = [
      createTestGrimoireEntry({
        id: '1',
        taskTitle: 'Test Task',
        narrative: 'This is a test narrative.',
        rewardXp: 10,
        rewardGold: 5,
      }),
    ];

    render(<Grimoire {...defaultProps} entries={entries} />);

    expect(screen.getByText('Test Task')).toBeDefined();
    expect(screen.getByText(/This is a test narrative/)).toBeDefined();
    expect(screen.getByText(/\+10 XP/)).toBeDefined();
    expect(screen.getByText(/\+5 G/)).toBeDefined();
  });

  it('複数のエントリを表示する', () => {
    const entries = [
      createTestGrimoireEntry({ id: '1', taskTitle: 'Task 1' }),
      createTestGrimoireEntry({ id: '2', taskTitle: 'Task 2' }),
      createTestGrimoireEntry({ id: '3', taskTitle: 'Task 3' }),
    ];

    render(<Grimoire {...defaultProps} entries={entries} />);

    expect(screen.getByText('Task 1')).toBeDefined();
    expect(screen.getByText('Task 2')).toBeDefined();
    expect(screen.getByText('Task 3')).toBeDefined();
  });

  it('エントリを逆順で表示する（最新が上）', () => {
    const entries = [
      createTestGrimoireEntry({ id: '1', taskTitle: 'First Task' }),
      createTestGrimoireEntry({ id: '2', taskTitle: 'Second Task' }),
    ];

    const { container } = render(<Grimoire {...defaultProps} entries={entries} />);
    const taskTitles = screen.getAllByText(/Task/);
    
    // 最後のエントリが最初に表示される
    expect(taskTitles[0].textContent).toContain('Second Task');
  });

  it('グリモワール作成ボタンを表示する', () => {
    render(<Grimoire {...defaultProps} />);
    const button = screen.getByRole('button', { name: /グリモワール作成/ });
    expect(button).toBeDefined();
  });

  it('生成可能な場合、ボタンが有効', () => {
    render(<Grimoire {...defaultProps} />);
    const button = screen.getByRole('button', { name: /グリモワール作成/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('生成中の場合、ボタンが無効化される', () => {
    render(<Grimoire {...defaultProps} isGenerating={true} />);
    const button = screen.getByRole('button', { name: /生成中/ }) as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  it('生成中の場合、「生成中...」と表示する', () => {
    render(<Grimoire {...defaultProps} isGenerating={true} />);
    expect(screen.getByText(/生成中/)).toBeDefined();
  });

  it('残り回数を表示する', () => {
    mockUseAiUsage.mockReturnValue({
      canGenerateGrimoire: true,
      grimoireRemaining: 3,
      isLoading: false,
    });

    render(<Grimoire {...defaultProps} />);
    expect(screen.getByText(/3回残り/)).toBeDefined();
  });

  it('生成エラーを表示する', () => {
    mockUseGrimoire.mockReturnValue({
      generateGrimoire: mockGenerateGrimoire,
      isGenerating: false,
      generateError: new Error('Generation failed'),
    });

    render(<Grimoire {...defaultProps} />);
    expect(screen.getByText(/エラー/)).toBeDefined();
    expect(screen.getByText(/Generation failed/)).toBeDefined();
  });

  it('外部からonGenerateが提供された場合、それを使用する', () => {
    const onGenerate = vi.fn();
    render(<Grimoire {...defaultProps} onGenerate={onGenerate} />);

    const button = screen.getByRole('button', { name: /グリモワール作成/ });
    fireEvent.click(button);

    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it('日付を表示する', () => {
    const entries = [
      createTestGrimoireEntry({
        id: '1',
        date: '2024-01-01',
        taskTitle: 'Test Task',
      }),
    ];

    render(<Grimoire {...defaultProps} entries={entries} />);
    expect(screen.getByText('2024-01-01')).toBeDefined();
  });
});
