ALTER TABLE "payout_request" ADD COLUMN "paid_cents" integer;--> statement-breakpoint
ALTER TABLE "payout_request" ADD COLUMN "paid_currency" text;--> statement-breakpoint
ALTER TABLE "payout_request" ADD COLUMN "fx_rate" numeric(12, 6);--> statement-breakpoint
ALTER TABLE "payout_request" ADD COLUMN "fx_rate_date" text;