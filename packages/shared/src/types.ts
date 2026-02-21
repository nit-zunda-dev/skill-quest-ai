export enum AppMode {
  GENESIS = 'GENESIS',
  DASHBOARD = 'DASHBOARD',
}

export enum Genre {
  FANTASY = 'ハイファンタジー',
  CYBERPUNK = 'サイバーパンク',
  MODERN = '現代ドラマ',
  HORROR = 'エルドリッチホラー',
  SCI_FI = 'スペースオペラ',
}

export enum Difficulty {
  EASY = 'EASY',
  MEDIUM = 'MEDIUM',
  HARD = 'HARD',
}

export enum TaskType {
  DAILY = 'DAILY',
  HABIT = 'HABIT',
  TODO = 'TODO',
}

export interface GenesisFormData {
  name: string;
  goal: string;
  genre: Genre;
}

export interface CharacterProfile {
  name: string;
  className: string;
  title: string;
  prologue: string;
  themeColor: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  gold: number;
  genre: Genre;
  /** 目標（クエスト自動生成の入力）。既存ユーザーは未設定のためオプショナル。 */
  goal?: string;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  difficulty: Difficulty;
  completed: boolean;
  status?: 'todo' | 'in_progress' | 'done';
  streak?: number; // For Habits/Dailies
}

export interface GrimoireEntry {
  id: string;
  date: string;
  taskTitle: string;
  narrative: string;
  rewardXp: number;
  rewardGold: number;
}

export interface UserState {
  isRegistered: boolean;
  profile: CharacterProfile | null;
  tasks: Task[];
  grimoire: GrimoireEntry[];
}
