CREATE TABLE "preset_collection" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"author" text,
	"created_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "preset_media" ADD COLUMN "collection_id" text;--> statement-breakpoint
ALTER TABLE "preset_collection" ADD CONSTRAINT "preset_collection_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "preset_collection_created_at_idx" ON "preset_collection" USING btree ("created_at");--> statement-breakpoint
ALTER TABLE "preset_media" ADD CONSTRAINT "preset_media_collection_id_preset_collection_id_fk" FOREIGN KEY ("collection_id") REFERENCES "public"."preset_collection"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "preset_media_collection_id_idx" ON "preset_media" USING btree ("collection_id");