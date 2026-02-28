import { sqliteTable, text, integer, unique, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Better Auth用テーブル

export const user = sqliteTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' }),
  image: text('image'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

export const session = sqliteTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

export const account = sqliteTable('account', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(), // Better Auth 1.4+ で必須
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'), // Better Auth 1.4+ で追加
  accessTokenExpiresAt: integer('access_token_expires_at', { mode: 'timestamp' }),
  refreshTokenExpiresAt: integer('refresh_token_expires_at', { mode: 'timestamp' }),
  scope: text('scope'), // Better Auth 1.4+ で追加
  password: text('password'), // メール/パスワード認証用
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

export const verification = sqliteTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// アプリケーション用テーブル

export const skills = sqliteTable('skills', {
  id: text('id').primaryKey(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

export const quests = sqliteTable('quests', {
  id: text('id').primaryKey(),
  userId: text('user_id').references(() => user.id, { onDelete: 'cascade' }),
  skillId: text('skill_id').references(() => skills.id, { onDelete: 'set null' }),
  title: text('title').notNull(),
  scenario: text('scenario'),
  difficulty: integer('difficulty').notNull(), // 1-5の範囲
  winCondition: text('win_condition', { mode: 'json' }), // JSON形式で勝利条件を格納
  status: text('status').default('todo'), // 'todo' | 'in_progress' | 'done'
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

export const grimoireEntries = sqliteTable('grimoire_entries', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  taskTitle: text('task_title').notNull(),
  narrative: text('narrative').notNull(),
  rewardXp: integer('reward_xp').notNull().default(0),
  rewardGold: integer('reward_gold').notNull().default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

export const userProgress = sqliteTable('user_progress', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  questId: text('quest_id').notNull().references(() => quests.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // 'not_started' | 'in_progress' | 'completed'
  score: integer('score'),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
}, (table) => ({
  uniqueUserQuest: unique().on(table.userId, table.questId),
}));

export const interactionLogs = sqliteTable('interaction_logs', {
  id: text('id').primaryKey(),
  progressId: text('progress_id').notNull().references(() => userProgress.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' | 'assistant'
  content: text('content', { mode: 'json' }).notNull(), // JSON形式でメッセージ内容を格納
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// AI利用制限（06_AI設計.md 利用制限ポリシー）
/** キャラ生成済みフラグ（1アカウント1回限り） */
export const userCharacterGenerated = sqliteTable('user_character_generated', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/** ユーザーキャラクタープロフィール（サインアップ時生成・ログイン時に取得） */
export const userCharacterProfile = sqliteTable('user_character_profile', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  profile: text('profile', { mode: 'json' }).notNull(), // CharacterProfile を JSON で保存
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

/** 日次AI利用回数（ナラティブ・パートナー・チャット・グリモワール・目標更新） */
export const aiDailyUsage = sqliteTable('ai_daily_usage', {
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  dateUtc: text('date_utc').notNull(), // YYYY-MM-DD (UTC)
  narrativeCount: integer('narrative_count').notNull().default(0),
  partnerCount: integer('partner_count').notNull().default(0),
  chatCount: integer('chat_count').notNull().default(0),
  grimoireCount: integer('grimoire_count').notNull().default(0),
  goalUpdateCount: integer('goal_update_count').notNull().default(0),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.dateUtc] }),
}));

/** レート制限ログ（短時間の連打防止用） */
export const rateLimitLogs = sqliteTable('rate_limit_logs', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  endpoint: text('endpoint').notNull(), // エンドポイントパス（例: '/api/ai/generate-character'）
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
});

// ガチャ: アイテムマスタ（Task 2.1）
/** 一意ID・カテゴリ・レアリティ・表示名・説明・ドロップ有効フラグ。category/rarity は仕様の閉集合。 */
export const items = sqliteTable('items', {
  id: text('id').primaryKey(),
  category: text('category').notNull(),
  rarity: text('rarity').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  enabledForDrop: integer('enabled_for_drop', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }),
});

// ガチャ: ユーザー所持履歴（Task 2.1）。同一ユーザー・同一クエストで高々1件。クエスト削除時は quest_id を NULL にする。
export const userAcquiredItems = sqliteTable(
  'user_acquired_items',
  {
    id: text('id').primaryKey(),
    userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
    itemId: text('item_id').notNull().references(() => items.id),
    questId: text('quest_id').references(() => quests.id, { onDelete: 'set null' }),
    acquiredAt: integer('acquired_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    uniqueUserQuest: unique().on(table.userId, table.questId),
  })
);

/** AIパートナー好感度（1ユーザー1値。0〜上限でクリップ） */
export const partnerFavorability = sqliteTable('partner_favorability', {
  userId: text('user_id').primaryKey().references(() => user.id, { onDelete: 'cascade' }),
  favorability: integer('favorability').notNull().default(0),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull(),
});

/** パートナー／ペットに渡したアイテム履歴（記録のみ。所持は消費しない） */
export const partnerItemGrants = sqliteTable('partner_item_grants', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  itemId: text('item_id').notNull().references(() => items.id),
  target: text('target').notNull(), // 'partner' | 'pet'
  grantedAt: integer('granted_at', { mode: 'timestamp' }).notNull(),
});

// リレーション定義

export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  progress: many(userProgress),
  quests: many(quests),
  grimoireEntries: many(grimoireEntries),
  acquiredItems: many(userAcquiredItems),
  partnerFavorability: one(partnerFavorability),
  partnerItemGrants: many(partnerItemGrants),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
  quests: many(quests),
}));

export const questsRelations = relations(quests, ({ one, many }) => ({
  user: one(user, {
    fields: [quests.userId],
    references: [user.id],
  }),
  skill: one(skills, {
    fields: [quests.skillId],
    references: [skills.id],
  }),
  progress: many(userProgress),
  acquiredItems: many(userAcquiredItems),
}));

export const grimoireEntriesRelations = relations(grimoireEntries, ({ one }) => ({
  user: one(user, {
    fields: [grimoireEntries.userId],
    references: [user.id],
  }),
}));

export const userProgressRelations = relations(userProgress, ({ one, many }) => ({
  user: one(user, {
    fields: [userProgress.userId],
    references: [user.id],
  }),
  quest: one(quests, {
    fields: [userProgress.questId],
    references: [quests.id],
  }),
  interactionLogs: many(interactionLogs),
}));

export const interactionLogsRelations = relations(interactionLogs, ({ one }) => ({
  progress: one(userProgress, {
    fields: [interactionLogs.progressId],
    references: [userProgress.id],
  }),
}));

export const itemsRelations = relations(items, ({ many }) => ({
  acquiredItems: many(userAcquiredItems),
  partnerItemGrants: many(partnerItemGrants),
}));

export const userAcquiredItemsRelations = relations(userAcquiredItems, ({ one }) => ({
  user: one(user, {
    fields: [userAcquiredItems.userId],
    references: [user.id],
  }),
  item: one(items, {
    fields: [userAcquiredItems.itemId],
    references: [items.id],
  }),
  quest: one(quests, {
    fields: [userAcquiredItems.questId],
    references: [quests.id],
  }),
}));

export const partnerFavorabilityRelations = relations(partnerFavorability, ({ one }) => ({
  user: one(user, {
    fields: [partnerFavorability.userId],
    references: [user.id],
  }),
}));

export const partnerItemGrantsRelations = relations(partnerItemGrants, ({ one }) => ({
  user: one(user, {
    fields: [partnerItemGrants.userId],
    references: [user.id],
  }),
  item: one(items, {
    fields: [partnerItemGrants.itemId],
    references: [items.id],
  }),
}));

// スキーマ全体をエクスポート（Better Authで使用）
export const schema = {
  user,
  session,
  account,
  verification,
  skills,
  quests,
  grimoireEntries,
  userProgress,
  interactionLogs,
  userCharacterGenerated,
  userCharacterProfile,
  aiDailyUsage,
  rateLimitLogs,
  items,
  userAcquiredItems,
  partnerFavorability,
  partnerItemGrants,
};
