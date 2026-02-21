PRAGMA foreign_keys = ON;
--> statement-breakpoint
ALTER TABLE `ai_daily_usage` ADD COLUMN `goal_update_count` integer DEFAULT 0 NOT NULL;
