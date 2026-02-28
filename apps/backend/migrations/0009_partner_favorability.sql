PRAGMA foreign_keys = ON;
--> statement-breakpoint
CREATE TABLE `partner_favorability` (
	`user_id` text PRIMARY KEY NOT NULL,
	`favorability` integer DEFAULT 0 NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
