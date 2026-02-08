PRAGMA foreign_keys = ON;
--> statement-breakpoint
CREATE TABLE `user_character_profile` (
	`user_id` text PRIMARY KEY NOT NULL,
	`profile` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
