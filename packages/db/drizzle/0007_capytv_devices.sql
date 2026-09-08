CREATE TABLE "vetoed_listing" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"listing_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "vetoed_listing_device_listing_key" UNIQUE("device_id","listing_id")
);
--> statement-breakpoint
-- Hand-edited, like 0005: the generated `ADD COLUMN ... NOT NULL` fails on a
-- table that already holds rows. Both new NOT NULL columns arrive nullable, take
-- a backfill, and only then become NOT NULL.
ALTER TABLE "device" ADD COLUMN "name" text;--> statement-breakpoint
UPDATE "device" SET "name" = "location" WHERE "name" IS NULL;--> statement-breakpoint
ALTER TABLE "device" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "photo_url" text;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "promotion_name" text;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "promotion_tagline" text;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "promotion_url" text;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "promotion_logo_url" text;--> statement-breakpoint
-- Every play written before this migration came from a live serve, so it took the
-- ten minutes that path has always given.
ALTER TABLE "play" ADD COLUMN "expires_at" timestamp;--> statement-breakpoint
UPDATE "play" SET "expires_at" = "created_at" + interval '10 minutes' WHERE "expires_at" IS NULL;--> statement-breakpoint
ALTER TABLE "play" ALTER COLUMN "expires_at" SET NOT NULL;--> statement-breakpoint
-- The daily play cap drops from 600 to 500 (roadmap decision #14). The cap is a
-- per-row column, so a device approved before this migration would keep the old
-- number. Only the old default moves; a cap somebody set by hand stays.
UPDATE "device" SET "daily_play_cap" = 500 WHERE "daily_play_cap" = 600;--> statement-breakpoint
ALTER TABLE "vetoed_listing" ADD CONSTRAINT "vetoed_listing_device_id_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."device"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vetoed_listing" ADD CONSTRAINT "vetoed_listing_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "vetoed_listing_device_idx" ON "vetoed_listing" USING btree ("device_id");
