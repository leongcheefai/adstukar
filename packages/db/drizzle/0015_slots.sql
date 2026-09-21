CREATE TYPE "public"."slot_state" AS ENUM('booked', 'running', 'ended', 'refunded');--> statement-breakpoint
CREATE TABLE "slot" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"campaign_id" text NOT NULL,
	"position" integer NOT NULL,
	"state" "slot_state" DEFAULT 'booked' NOT NULL,
	"amount" integer NOT NULL,
	"booked_at" timestamp NOT NULL,
	"starts_at" timestamp,
	"ends_at" timestamp,
	"ended_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "slot" ADD CONSTRAINT "slot_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "slot" ADD CONSTRAINT "slot_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "slot_user_created_idx" ON "slot" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "slot_campaign_idx" ON "slot" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "slot_state_ends_idx" ON "slot" USING btree ("state","ends_at");--> statement-breakpoint
CREATE UNIQUE INDEX "slot_position_live_key" ON "slot" USING btree ("position") WHERE "slot"."state" in ('booked', 'running');--> statement-breakpoint
CREATE UNIQUE INDEX "slot_campaign_live_key" ON "slot" USING btree ("campaign_id") WHERE "slot"."state" in ('booked', 'running');