CREATE TABLE `imported_clients` (
	`batch` text NOT NULL,
	`id` text NOT NULL,
	`payload` text NOT NULL,
	PRIMARY KEY(`batch`, `id`)
);
--> statement-breakpoint
CREATE TABLE `imports` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`metadata` text NOT NULL,
	`created` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `records` (
	`owner` text NOT NULL,
	`kind` text NOT NULL,
	`id` text NOT NULL,
	`payload` text NOT NULL,
	`updated` text NOT NULL,
	PRIMARY KEY(`owner`, `kind`, `id`)
);
--> statement-breakpoint
CREATE INDEX `records_owner_kind` ON `records` (`owner`,`kind`);