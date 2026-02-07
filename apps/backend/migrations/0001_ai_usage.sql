PRAGMA foreign_keys = ON;
--> statement-breakpoint
CREATE TABLE `user_character_generated` (
	`user_id` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `ai_daily_usage` (
	`user_id` text NOT NULL,
	`date_utc` text NOT NULL,
	`narrative_count` integer DEFAULT 0 NOT NULL,
	`partner_count` integer DEFAULT 0 NOT NULL,
	`chat_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	PRIMARY KEY(`user_id`, `date_utc`)
);
