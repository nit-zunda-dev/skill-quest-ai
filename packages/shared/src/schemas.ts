import { z } from 'zod';
import { Genre, Difficulty, TaskType } from './types';

// クエスト作成リクエストスキーマ
export const createQuestSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です').max(200, 'タイトルは200文字以内で入力してください'),
  type: z.nativeEnum(TaskType),
  difficulty: z.nativeEnum(Difficulty),
  skillId: z.string().optional(),
  scenario: z.string().optional(),
  winCondition: z.record(z.unknown()).optional(),
});

// クエスト更新リクエストスキーマ
export const updateQuestSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  type: z.nativeEnum(TaskType).optional(),
  difficulty: z.nativeEnum(Difficulty).optional(),
  completed: z.boolean().optional(),
  scenario: z.string().optional(),
  winCondition: z.record(z.unknown()).optional(),
});

// プロフィール更新リクエストスキーマ
export const updateProfileSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください').optional(),
  themeColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'テーマカラーは16進数カラーコード形式で入力してください').optional(),
});

// キャラクター生成リクエストスキーマ（GenesisFormData）
export const genesisFormDataSchema = z.object({
  name: z.string().min(1, '名前は必須です').max(50, '名前は50文字以内で入力してください'),
  goal: z.string().min(1, '目標は必須です').max(500, '目標は500文字以内で入力してください'),
  genre: z.nativeEnum(Genre),
});

// ナラティブ生成リクエストスキーマ
export const narrativeRequestSchema = z.object({
  taskId: z.string().min(1, 'タスクIDは必須です'),
  taskTitle: z.string().min(1, 'タスクタイトルは必須です'),
  taskType: z.nativeEnum(TaskType),
  difficulty: z.nativeEnum(Difficulty),
  userComment: z.string().optional(),
});

// チャットリクエストスキーマ
export const chatRequestSchema = z.object({
  message: z.string().min(1, 'メッセージは必須です').max(2000, 'メッセージは2000文字以内で入力してください'),
  context: z.record(z.unknown()).optional(),
});

// 認証関連スキーマ
export const signUpRequestSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
  name: z.string().min(1, '名前は必須です').max(100, '名前は100文字以内で入力してください'),
});

export const signInRequestSchema = z.object({
  email: z.string().email('有効なメールアドレスを入力してください'),
  password: z.string().min(1, 'パスワードは必須です'),
});

// 型推論用の型エクスポート
export type CreateQuestRequest = z.infer<typeof createQuestSchema>;
export type UpdateQuestRequest = z.infer<typeof updateQuestSchema>;
export type UpdateProfileRequest = z.infer<typeof updateProfileSchema>;
export type NarrativeRequest = z.infer<typeof narrativeRequestSchema>;
export type ChatRequest = z.infer<typeof chatRequestSchema>;
export type SignUpRequest = z.infer<typeof signUpRequestSchema>;
export type SignInRequest = z.infer<typeof signInRequestSchema>;
