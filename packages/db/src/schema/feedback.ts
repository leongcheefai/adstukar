import { pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { FEEDBACK_TYPES } from "./enums";

export const feedbackTypeEnum = pgEnum("feedback_type", FEEDBACK_TYPES);

export const feedback = pgTable("feedback", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  type: feedbackTypeEnum("type").notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  /** Null while the feedback is open. An admin stamps it, and may clear it again. */
  resolvedAt: timestamp("resolved_at"),
  resolvedBy: text("resolved_by").references(() => user.id, { onDelete: "set null" }),
});
