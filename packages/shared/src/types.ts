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

/**
 * アイテムマスタ用の型。
 * 一意ID・表示名・カテゴリ・レアリティを必須、説明は任意。
 */
export interface Item {
  id: string;
  name: string;
  category: Category;
  rarity: Rarity;
  /** 説明文（任意） */
  description?: string;
}

/**
 * 所持一覧表示用の型。クライアントが一覧表示に利用。
 * アイテムID・取得時刻・表示用の名前・カテゴリ・レアリティを含む。
 */
export interface AcquiredItemView {
  itemId: string;
  acquiredAt: string;
  name: string;
  category: Category;
  rarity: Rarity;
}

/**
 * アイテム画像パスの組み立て規則。
 * クライアントは category と id から /images/items/{category}/{id}.png を組み立てる。
 * buildItemImagePath(id, category) で同一規則を適用できる。
 */
export const ITEM_IMAGE_PATH_PATTERN = '/images/items/{category}/{id}.png';

/**
 * category と id からアイテム画像パスを組み立てる。
 * 規則: /images/items/{category}/{id}.png
 */
export function buildItemImagePath(id: string, category: Category): string {
  return `/images/items/${category}/${id}.png`;
}

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
