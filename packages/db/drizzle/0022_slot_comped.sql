ALTER TABLE "slot" ADD COLUMN "comped" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "slot" ADD COLUMN "comped_by" text;--> statement-breakpoint
ALTER TABLE "slot" ADD CONSTRAINT "slot_comped_by_user_id_fk" FOREIGN KEY ("comped_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;