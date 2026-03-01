PRAGMA foreign_keys = ON;
--> statement-breakpoint
ALTER TABLE `ai_daily_usage` ADD COLUMN `neurons_estimate` integer DEFAULT 0 NOT NULL;
