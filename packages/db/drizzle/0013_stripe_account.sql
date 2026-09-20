CREATE TABLE "stripe_account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"stripe_account_id" text NOT NULL,
	"country" text NOT NULL,
	"details_submitted" boolean DEFAULT false NOT NULL,
	"payouts_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "stripe_account_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "stripe_account_stripe_account_id_unique" UNIQUE("stripe_account_id")
);
--> statement-breakpoint
ALTER TABLE "payout_request" ADD COLUMN "stripe_transfer_id" text;--> statement-breakpoint
ALTER TABLE "stripe_account" ADD CONSTRAINT "stripe_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_request" ADD CONSTRAINT "payout_request_stripe_transfer_id_unique" UNIQUE("stripe_transfer_id");