PRAGMA foreign_keys = ON;
--> statement-breakpoint
ALTER TABLE `ai_daily_usage` ADD COLUMN `grimoire_count` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `quests` ADD COLUMN `status` text DEFAULT 'todo';
