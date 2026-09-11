CREATE TYPE "public"."campaign_state" AS ENUM('draft', 'active', 'paused', 'archived');--> statement-breakpoint
CREATE TYPE "public"."device_state" AS ENUM('pending', 'approved', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."device_tier" AS ENUM('standard', 'premium', 'flagship');--> statement-breakpoint
CREATE TYPE "public"."ledger_lot" AS ENUM('bought', 'earned', 'granted');--> statement-breakpoint
CREATE TYPE "public"."listing_state" AS ENUM('pending', 'approved', 'rejected', 'archived');--> statement-breakpoint
CREATE TYPE "public"."placement_format" AS ENUM('band', 'float', 'ticker');--> statement-breakpoint
CREATE TYPE "public"."placement_size" AS ENUM('small', 'medium', 'large');--> statement-breakpoint
CREATE TYPE "public"."play_state" AS ENUM('open', 'counted', 'void');--> statement-breakpoint
CREATE TYPE "public"."venue_type" AS ENUM('cafe', 'restaurant', 'salon', 'gym', 'clinic', 'retail', 'office', 'other');--> statement-breakpoint
ALTER TYPE "public"."ledger_reason" ADD VALUE 'fee' BEFORE 'grant';--> statement-breakpoint
ALTER TYPE "public"."ledger_reason" ADD VALUE 'topup' BEFORE 'expiry';--> statement-breakpoint
ALTER TYPE "public"."ledger_reason" ADD VALUE 'payout' BEFORE 'expiry';--> statement-breakpoint
ALTER TYPE "public"."ledger_reason" ADD VALUE 'refund' BEFORE 'expiry';--> statement-breakpoint
CREATE TABLE "campaign" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"domain" text NOT NULL,
	"state" "campaign_state" DEFAULT 'draft' NOT NULL,
	"daily_budget" integer NOT NULL,
	"verification_token" text NOT NULL,
	"verified_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "device" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"device_id" text NOT NULL,
	"api_key" text NOT NULL,
	"venue_type" "venue_type" DEFAULT 'other' NOT NULL,
	"location" text NOT NULL,
	"tier" "device_tier" DEFAULT 'standard' NOT NULL,
	"state" "device_state" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"daily_play_cap" integer NOT NULL,
	"approved_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "device_device_id_unique" UNIQUE("device_id"),
	CONSTRAINT "device_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "excluded_term" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"phrase" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "listing" (
	"id" text PRIMARY KEY NOT NULL,
	"campaign_id" text NOT NULL,
	"tagline" text NOT NULL,
	"logo_url" text,
	"state" "listing_state" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "placement" (
	"id" text PRIMARY KEY NOT NULL,
	"device_id" text NOT NULL,
	"format" "placement_format" DEFAULT 'band' NOT NULL,
	"size" "placement_size" DEFAULT 'medium' NOT NULL,
	"dwell_seconds" integer NOT NULL,
	"gap_seconds" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "play" (
	"id" text PRIMARY KEY NOT NULL,
	"placement_id" text NOT NULL,
	"listing_id" text,
	"house" boolean DEFAULT false NOT NULL,
	"state" "play_state" DEFAULT 'open' NOT NULL,
	"scanned" boolean DEFAULT false NOT NULL,
	"counted_at" timestamp,
	"scanned_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
--> Hand-edited: the generated statement adds a NOT NULL column with no default and
--> fails on a table that already holds rows. Barter-era entries carry no lot, and
--> `granted` is the only safe label for them: a granted point neither refunds nor
--> withdraws, so no point from the dead economy can leave as cash. The default is
--> dropped again, so every new row must state its lot.
ALTER TABLE "ledger_entry" ADD COLUMN "lot" "ledger_lot" DEFAULT 'granted' NOT NULL;--> statement-breakpoint
ALTER TABLE "ledger_entry" ALTER COLUMN "lot" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD COLUMN "play_id" text;--> statement-breakpoint
ALTER TABLE "campaign" ADD CONSTRAINT "campaign_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "device" ADD CONSTRAINT "device_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "excluded_term" ADD CONSTRAINT "excluded_term_device_id_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."device"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "listing" ADD CONSTRAINT "listing_campaign_id_campaign_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaign"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement" ADD CONSTRAINT "placement_device_id_device_id_fk" FOREIGN KEY ("device_id") REFERENCES "public"."device"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play" ADD CONSTRAINT "play_placement_id_placement_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placement"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "play" ADD CONSTRAINT "play_listing_id_listing_id_fk" FOREIGN KEY ("listing_id") REFERENCES "public"."listing"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaign_user_idx" ON "campaign" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "campaign_state_idx" ON "campaign" USING btree ("state");--> statement-breakpoint
CREATE INDEX "device_user_idx" ON "device" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "device_state_idx" ON "device" USING btree ("state");--> statement-breakpoint
CREATE INDEX "excluded_term_device_idx" ON "excluded_term" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "listing_campaign_idx" ON "listing" USING btree ("campaign_id");--> statement-breakpoint
CREATE INDEX "listing_state_idx" ON "listing" USING btree ("state");--> statement-breakpoint
CREATE INDEX "placement_device_idx" ON "placement" USING btree ("device_id");--> statement-breakpoint
CREATE INDEX "play_placement_created_idx" ON "play" USING btree ("placement_id","created_at");--> statement-breakpoint
CREATE INDEX "play_listing_created_idx" ON "play" USING btree ("listing_id","created_at");--> statement-breakpoint
CREATE INDEX "play_state_created_idx" ON "play" USING btree ("state","created_at");--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_play_id_play_id_fk" FOREIGN KEY ("play_id") REFERENCES "public"."play"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "ledger_entry_user_lot_idx" ON "ledger_entry" USING btree ("user_id","lot","state");