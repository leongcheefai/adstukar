ALTER TABLE "ledger_entry" DROP CONSTRAINT "ledger_entry_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "ledger_entry" ADD CONSTRAINT "ledger_entry_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE restrict ON UPDATE no action;