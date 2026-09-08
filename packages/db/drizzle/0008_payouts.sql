CREATE TYPE "public"."payout_method" AS ENUM('bank', 'paypal');--> statement-breakpoint
CREATE TYPE "public"."payout_state" AS ENUM('requested', 'paid', 'rejected');--> statement-breakpoint
CREATE TABLE "payout_account" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"legal_name" text NOT NULL,
	"country" text NOT NULL,
	"method" "payout_method" NOT NULL,
	"destination" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payout_account_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "payout_request" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"points" integer NOT NULL,
	"usd_cents" integer NOT NULL,
	"state" "payout_state" DEFAULT 'requested' NOT NULL,
	"ledger_entry_id" text,
	"reference" text,
	"rejection_reason" text,
	"reviewed_by" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "open_hour" integer;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "close_hour" integer;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "timezone" text;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "last_seen_at" timestamp;--> statement-breakpoint
ALTER TABLE "device" ADD COLUMN "last_network" text;--> statement-breakpoint
ALTER TABLE "payout_account" ADD CONSTRAINT "payout_account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_request" ADD CONSTRAINT "payout_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_request" ADD CONSTRAINT "payout_request_ledger_entry_id_ledger_entry_id_fk" FOREIGN KEY ("ledger_entry_id") REFERENCES "public"."ledger_entry"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payout_request" ADD CONSTRAINT "payout_request_reviewed_by_user_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "payout_request_user_created_idx" ON "payout_request" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "payout_request_state_idx" ON "payout_request" USING btree ("state","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "payout_request_open_key" ON "payout_request" USING btree ("user_id") WHERE "payout_request"."state" = 'requested';--> statement-breakpoint
CREATE INDEX "device_network_idx" ON "device" USING btree ("last_network");