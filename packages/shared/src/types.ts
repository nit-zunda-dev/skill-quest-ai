/**
 * ガチャアイテムのレアリティ（5段階）。
 * 表示・ソート用の大小関係: common < rare < super-rare < ultra-rare < legend
 * （RARITY_ORDER で順序を保証）
 */
export enum Rarity {
  COMMON = 'common',
  RARE = 'rare',
  SUPER_RARE = 'super-rare',
  ULTRA_RARE = 'ultra-rare',
  LEGEND = 'legend',
}

/**
 * 表示・ソート用のレアリティ順序（昇順: コモンが最小、レジェンドが最大）。
 * common 未満 rare 未満 super-rare 未満 ultra-rare 未満 legend
 */
export const RARITY_ORDER: readonly Rarity[] = [
  Rarity.COMMON,
  Rarity.RARE,
  Rarity.SUPER_RARE,
  Rarity.ULTRA_RARE,
  Rarity.LEGEND,
] as const;

/**
 * ガチャアイテムのカテゴリ（閉集合）。
 * 仕様で定義された7カテゴリのみ。追加は変更プロセスに従う。
 */
export enum Category {
  DRINK = 'drink',
  CHIP = 'chip',
  BADGE = 'badge',
  TOOL = 'tool',
  ARTIFACT = 'artifact',
  ANDROID = 'android',
  MYTHICAL = 'mythical',
}

/** カテゴリの閉集合（全7種）。バリデーション・一覧に利用。 */
export const CATEGORIES: readonly Category[] = [
  Category.DRINK,
  Category.CHIP,
  Category.BADGE,
  Category.TOOL,
  Category.ARTIFACT,
  Category.ANDROID,
  Category.MYTHICAL,
] as const;

export enum AppMode {
  GENESIS = 'GENESIS',
  DASHBOARD = 'DASHBOARD',
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
