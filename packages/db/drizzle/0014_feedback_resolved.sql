ALTER TABLE "feedback" ADD COLUMN "resolved_at" timestamp;--> statement-breakpoint
ALTER TABLE "feedback" ADD COLUMN "resolved_by" text;--> statement-breakpoint
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_resolved_by_user_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;