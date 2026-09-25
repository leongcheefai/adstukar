CREATE TYPE "public"."media_kind" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TABLE "preset_media" (
	"id" text PRIMARY KEY NOT NULL,
	"kind" "media_kind" NOT NULL,
	"name" text NOT NULL,
	"key" text NOT NULL,
	"url" text NOT NULL,
	"size" integer NOT NULL,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "preset_media" ADD CONSTRAINT "preset_media_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "preset_media_key_key" ON "preset_media" USING btree ("key");--> statement-breakpoint
CREATE INDEX "preset_media_created_at_idx" ON "preset_media" USING btree ("created_at");