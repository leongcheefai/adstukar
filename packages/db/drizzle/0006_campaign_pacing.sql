CREATE TYPE "public"."campaign_pause_reason" AS ENUM('budget', 'balance');--> statement-breakpoint
ALTER TYPE "public"."listing_state" ADD VALUE 'paused' BEFORE 'archived';--> statement-breakpoint
ALTER TABLE "campaign" ADD COLUMN "pause_reason" "campaign_pause_reason";--> statement-breakpoint
ALTER TABLE "campaign" ADD COLUMN "paused_at" timestamp;