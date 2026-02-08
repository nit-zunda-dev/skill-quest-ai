PRAGMA foreign_keys = ON;
--> statement-breakpoint
ALTER TABLE `quests` ADD COLUMN `user_id` text;
--> statement-breakpoint
ALTER TABLE `quests` ADD COLUMN `completed_at` integer;
--> statement-breakpoint
CREATE TABLE `grimoire_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`task_title` text NOT NULL,
	`narrative` text NOT NULL,
	`reward_xp` integer DEFAULT 0 NOT NULL,
	`reward_gold` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
