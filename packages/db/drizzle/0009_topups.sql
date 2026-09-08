CREATE TYPE "public"."topup_state" AS ENUM('pending', 'paid', 'refunded', 'abandoned');--> statement-breakpoint
CREATE TABLE "topup" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"points" integer NOT NULL,
	"usd_cents" integer NOT NULL,
	"state" "topup_state" DEFAULT 'pending' NOT NULL,
	"stripe_session_id" text,
	"stripe_payment_intent_id" text,
	"ledger_entry_id" text,
	"refunded_points" integer,
	"refund_usd_cents" integer,
	"refund_ledger_entry_id" text,
	"stripe_refund_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"paid_at" timestamp,
	"refunded_at" timestamp,
	CONSTRAINT "topup_stripe_session_id_unique" UNIQUE("stripe_session_id"),
	CONSTRAINT "topup_stripe_payment_intent_id_unique" UNIQUE("stripe_payment_intent_id")
);
--> statement-breakpoint
ALTER TABLE "topup" ADD CONSTRAINT "topup_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topup" ADD CONSTRAINT "topup_ledger_entry_id_ledger_entry_id_fk" FOREIGN KEY ("ledger_entry_id") REFERENCES "public"."ledger_entry"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "topup" ADD CONSTRAINT "topup_refund_ledger_entry_id_ledger_entry_id_fk" FOREIGN KEY ("refund_ledger_entry_id") REFERENCES "public"."ledger_entry"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "topup_user_created_idx" ON "topup" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "topup_user_paid_idx" ON "topup" USING btree ("user_id","paid_at");--> statement-breakpoint
CREATE INDEX "topup_state_idx" ON "topup" USING btree ("state");