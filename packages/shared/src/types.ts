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

export interface CharacterStats {
  strength: number; // Health/Fitness
  intelligence: number; // Learning/Work
  charisma: number; // Social/Connection
  willpower: number; // Consistency/Habits
  luck: number; // Random factor
}

export interface CharacterProfile {
  name: string;
  className: string;
  title: string;
  stats: CharacterStats;
  prologue: string;
  themeColor: string;
  level: number;
  currentXp: number;
  nextLevelXp: number;
  hp: number;
  maxHp: number;
  gold: number;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  difficulty: Difficulty;
  completed: boolean;
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
