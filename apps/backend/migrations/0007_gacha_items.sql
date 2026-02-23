PRAGMA foreign_keys = ON;
--> statement-breakpoint
CREATE TABLE `items` (
	`id` text PRIMARY KEY NOT NULL,
	`category` text NOT NULL,
	`rarity` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`enabled_for_drop` integer DEFAULT 1 NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
CREATE TABLE `user_acquired_items` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`item_id` text NOT NULL,
	`quest_id` text,
	`acquired_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`item_id`) REFERENCES `items`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`quest_id`) REFERENCES `quests`(`id`) ON UPDATE no action ON DELETE set null,
	UNIQUE(`user_id`, `quest_id`)
);
--> statement-breakpoint
CREATE INDEX `user_acquired_items_user_id_acquired_at_idx` ON `user_acquired_items` (`user_id`, `acquired_at`);
