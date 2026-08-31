CREATE TYPE "public"."ledger_reason" AS ENUM('earn', 'spend', 'grant', 'expiry', 'void');--> statement-breakpoint
CREATE TYPE "public"."ledger_state" AS ENUM('pending', 'settled', 'void');--> statement-breakpoint
CREATE TYPE "public"."placement_size" AS ENUM('small', 'medium');--> statement-breakpoint
CREATE TYPE "public"."product_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "excluded_term" (
	"id" text PRIMARY KEY NOT NULL,
	"placement_id" text NOT NULL,
	"phrase" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "impression" (
	"id" text PRIMARY KEY NOT NULL,
	"placement_id" text NOT NULL,
	"served_product_id" text,
	"house" boolean DEFAULT false NOT NULL,
	"session_hash" text NOT NULL,
	"viewable" boolean DEFAULT false NOT NULL,
	"viewed_at" timestamp,
	"clicked" boolean DEFAULT false NOT NULL,
	"clicked_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ledger_entry" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"delta" integer NOT NULL,
	"state" "ledger_state" NOT NULL,
	"reason" "ledger_reason" NOT NULL,
	"impression_id" text,
	"related_entry_id" text,
	"idempotency_key" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"settles_at" timestamp,
	"settled_at" timestamp,
	CONSTRAINT "ledger_entry_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
CREATE TABLE "placement" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"api_key" text NOT NULL,
	"size" "placement_size" DEFAULT 'small' NOT NULL,
	"house_ad_pct" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "placement_api_key_unique" UNIQUE("api_key")
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"domain" text NOT NULL,
	"tagline" text NOT NULL,
	"logo_url" text,
	"status" "product_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"verification_token" text NOT NULL,
	"verified_at" timestamp,
	"advertise" boolean DEFAULT true NOT NULL,
	"show_ads" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "excluded_term" ADD CONSTRAINT "excluded_term_placement_id_placement_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impression" ADD CONSTRAINT "impression_placement_id_placement_id_fk" FOREIGN KEY ("placement_id") REFERENCES "public"."placement"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "impression" ADD CONSTRAINT "impression_served_product_id_product_id_fk" FOREIGN KEY ("served_product_id") REFERENCES "public"."product"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_impression_id_impression_id_fk" FOREIGN KEY ("impression_id") REFERENCES "public"."impression"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "placement" ADD CONSTRAINT "placement_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "product" ADD CONSTRAINT "product_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "excluded_term_placement_idx" ON "excluded_term" USING btree ("placement_id");--> statement-breakpoint
CREATE INDEX "impression_placement_created_idx" ON "impression" USING btree ("placement_id","created_at");--> statement-breakpoint
CREATE INDEX "impression_product_created_idx" ON "impression" USING btree ("served_product_id","created_at");--> statement-breakpoint
CREATE INDEX "impression_session_created_idx" ON "impression" USING btree ("session_hash","created_at");--> statement-breakpoint
CREATE INDEX "ledger_entry_user_state_idx" ON "ledger_entry" USING btree ("user_id","state");--> statement-breakpoint
CREATE INDEX "ledger_entry_user_created_idx" ON "ledger_entry" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ledger_entry_settles_idx" ON "ledger_entry" USING btree ("state","settles_at");--> statement-breakpoint
CREATE INDEX "placement_product_idx" ON "placement" USING btree ("product_id");--> statement-breakpoint
CREATE INDEX "product_user_idx" ON "product" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "product_status_idx" ON "product" USING btree ("status");