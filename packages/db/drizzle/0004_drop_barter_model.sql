ALTER TABLE "excluded_term" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "impression" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "placement" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "product" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "excluded_term" CASCADE;--> statement-breakpoint
DROP TABLE "impression" CASCADE;--> statement-breakpoint
DROP TABLE "placement" CASCADE;--> statement-breakpoint
DROP TABLE "product" CASCADE;--> statement-breakpoint
ALTER TABLE "ledger_entry" DROP CONSTRAINT IF EXISTS "ledger_entry_impression_id_impression_id_fk";
--> statement-breakpoint
ALTER TABLE "ledger_entry" DROP COLUMN "impression_id";--> statement-breakpoint
DROP TYPE "public"."placement_size";--> statement-breakpoint
DROP TYPE "public"."product_status";