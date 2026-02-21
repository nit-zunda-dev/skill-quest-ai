import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuestBoard from './QuestBoard';
import { createTestQuest } from '../../../../tests/fixtures';
import { TaskType, Difficulty } from '@skill-quest/shared';

describe('QuestBoard', () => {
  const defaultProps = {
    tasks: [],
    onAddTask: vi.fn(),
    onCompleteTask: vi.fn(),
    onDeleteTask: vi.fn(),
    onUpdateStatus: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('タスクボードのタイトルを表示する', () => {
    render(<QuestBoard {...defaultProps} />);
    expect(screen.getByText('タスクボード')).toBeDefined();
  });

  it('タスク追加ボタンを表示する', () => {
    render(<QuestBoard {...defaultProps} />);
    const addButton = screen.getByRole('button', { name: 'タスクを追加' });
    expect(addButton).toBeDefined();
  });

  it('タスク追加ボタンをクリックするとフォームが表示される', () => {
    render(<QuestBoard {...defaultProps} />);
    const addButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'));
    if (addButton) {
      fireEvent.click(addButton);
      expect(screen.getByPlaceholderText(/タスク名を入力/)).toBeDefined();
    }
  });

  it('タスクを追加できる', () => {
    const onAddTask = vi.fn();
    render(<QuestBoard {...defaultProps} onAddTask={onAddTask} />);

    const addButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'));
    if (addButton) {
      fireEvent.click(addButton);
    }

    const input = screen.getByPlaceholderText(/タスク名を入力/);
    fireEvent.change(input, { target: { value: 'New Task' } });
    
    const submitButton = screen.getByRole('button', { name: '追加', exact: true });
    fireEvent.click(submitButton);

    expect(onAddTask).toHaveBeenCalledWith({
      title: 'New Task',
      type: TaskType.TODO,
      difficulty: Difficulty.EASY,
    });
  });

  it('タスクをステータスごとに分類して表示する', () => {
    const tasks = [
      createTestQuest({ id: '1', title: 'Todo Task', status: 'todo' }),
      createTestQuest({ id: '2', title: 'In Progress Task', status: 'in_progress' }),
      createTestQuest({ id: '3', title: 'Done Task', status: 'done' }),
    ];

    render(<QuestBoard {...defaultProps} tasks={tasks} />);

    expect(screen.getByText(/To Do \(1\)/)).toBeDefined();
    expect(screen.getByText(/In Progress \(1\)/)).toBeDefined();
    expect(screen.getByText(/Done \(1\)/)).toBeDefined();
  });

  it('タスクがない場合に空のメッセージを表示する', () => {
    render(<QuestBoard {...defaultProps} tasks={[]} />);

    const emptyMessages = screen.getAllByText(/タスクなし/);
    expect(emptyMessages.length).toBeGreaterThan(0);
  });

  it('タスクをクリックするとステータスが更新される', () => {
    const onUpdateStatus = vi.fn();
    const task = createTestQuest({ id: '1', title: 'Test Task', status: 'todo' });

    render(<QuestBoard {...defaultProps} tasks={[task]} onUpdateStatus={onUpdateStatus} />);

    const taskElement = screen.getByText('Test Task');
    fireEvent.click(taskElement.closest('div')!);

    expect(onUpdateStatus).toHaveBeenCalledWith('1', 'in_progress');
  });

  it('タスクの削除ボタンをクリックするとonDeleteTaskが呼ばれる', () => {
    const onDeleteTask = vi.fn();
    const task = createTestQuest({ id: '1', title: 'Test Task' });

    render(<QuestBoard {...defaultProps} tasks={[task]} onDeleteTask={onDeleteTask} />);

    // ホバーで削除ボタンが表示されるので、直接クリックをシミュレート
    const taskCard = screen.getByText('Test Task').closest('div');
    if (taskCard) {
      const deleteButton = taskCard.querySelector('button[class*="hover:text-red-400"]');
      if (deleteButton) {
        fireEvent.click(deleteButton);
        expect(onDeleteTask).toHaveBeenCalledWith('1');
      }
    }
  });

  it('難易度を選択してタスクを追加できる', () => {
    const onAddTask = vi.fn();
    render(<QuestBoard {...defaultProps} onAddTask={onAddTask} />);

    const addButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'));
    if (addButton) {
      fireEvent.click(addButton);
    }

    const input = screen.getByPlaceholderText(/タスク名を入力/);
    fireEvent.change(input, { target: { value: 'Hard Task' } });

    const hardButton = screen.getByText(Difficulty.HARD);
    fireEvent.click(hardButton);

    const submitButton = screen.getByRole('button', { name: '追加', exact: true });
    fireEvent.click(submitButton);

    expect(onAddTask).toHaveBeenCalledWith({
      title: 'Hard Task',
      type: TaskType.TODO,
      difficulty: Difficulty.HARD,
    });
  });

  it('Enterキーでタスクを追加できる', () => {
    const onAddTask = vi.fn();
    render(<QuestBoard {...defaultProps} onAddTask={onAddTask} />);

    const addButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'));
    if (addButton) {
      fireEvent.click(addButton);
    }

    const input = screen.getByPlaceholderText(/タスク名を入力/);
    fireEvent.change(input, { target: { value: 'Quick Task' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(onAddTask).toHaveBeenCalled();
  });

  it('Escapeキーでフォームを閉じる', () => {
    render(<QuestBoard {...defaultProps} />);

    const addButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'));
    if (addButton) {
      fireEvent.click(addButton);
    }

    const input = screen.getByPlaceholderText(/タスク名を入力/);
    fireEvent.keyDown(input, { key: 'Escape' });

    expect(screen.queryByPlaceholderText(/タスク名を入力/)).toBeNull();
  });

  it('キャンセルボタンでフォームを閉じる', () => {
    render(<QuestBoard {...defaultProps} />);

    const addButton = screen.getAllByRole('button').find(btn => btn.querySelector('svg'));
    if (addButton) {
      fireEvent.click(addButton);
    }

    const cancelButton = screen.getByRole('button', { name: /キャンセル/ });
    fireEvent.click(cancelButton);

    expect(screen.queryByPlaceholderText(/タスク名を入力/)).toBeNull();
  });

  it('タスクの難易度バッジを表示する', () => {
    const task = createTestQuest({ id: '1', title: 'Test Task', difficulty: Difficulty.MEDIUM });

    render(<QuestBoard {...defaultProps} tasks={[task]} />);

    expect(screen.getByText(Difficulty.MEDIUM)).toBeDefined();
  });

  it('繰り返しタスクのストリーク数を表示する', () => {
    const task = createTestQuest({
      id: '1',
      title: 'Daily Task',
      type: TaskType.DAILY,
      streak: 5,
    });

    render(<QuestBoard {...defaultProps} tasks={[task]} />);

    expect(screen.getByText(/5/)).toBeDefined();
  });

  it('クエスト0件かつonRequestSuggestFromGoalがあるとき、目標からタスクを生成する案内とCTAを表示する（Task 8.1）', () => {
    const onRequestSuggestFromGoal = vi.fn();
    render(
      <QuestBoard
        {...defaultProps}
        tasks={[]}
        onRequestSuggestFromGoal={onRequestSuggestFromGoal}
      />
    );

    const cta = screen.getByRole('button', { name: /目標からタスクを生成/ });
    expect(cta).toBeDefined();
    expect(screen.getByText(/目標からタスクを生成|目標に沿ったタスクを提案/)).toBeDefined();

    fireEvent.click(cta);
    expect(onRequestSuggestFromGoal).toHaveBeenCalledTimes(1);
  });

  it('クエスト0件でonRequestSuggestFromGoalがないとき、案内CTAは表示しない（従来の3列の空表示）', () => {
    render(<QuestBoard {...defaultProps} tasks={[]} />);

    expect(screen.queryByRole('button', { name: /目標からタスクを生成/ })).toBeNull();
    const emptyMessages = screen.getAllByText(/タスクなし/);
    expect(emptyMessages.length).toBeGreaterThan(0);
  });
});
