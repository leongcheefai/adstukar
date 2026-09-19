ALTER TABLE "payout_request" RENAME COLUMN "points" TO "amount";--> statement-breakpoint
ALTER TABLE "topup" RENAME COLUMN "points" TO "amount";--> statement-breakpoint
ALTER TABLE "topup" RENAME COLUMN "refunded_points" TO "refunded_amount";