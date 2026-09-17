import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Every Stripe event, once, by its id. The webhook inserts before it acts, so a
 * retry from Stripe finds the row and does nothing.
 */
export const webhookEvent = pgTable("webhook_event", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  receivedAt: timestamp("received_at").notNull().defaultNow(),
});
