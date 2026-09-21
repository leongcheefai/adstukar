ALTER TABLE "campaign" DROP COLUMN "pause_reason";--> statement-breakpoint
ALTER TABLE "campaign" DROP COLUMN "paused_at";--> statement-breakpoint
ALTER TABLE "campaign" DROP COLUMN "daily_budget";--> statement-breakpoint
DROP TYPE "public"."campaign_pause_reason";