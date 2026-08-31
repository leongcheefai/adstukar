import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const release = pgTable("release", {
  id: text("id").primaryKey(),
  tag: text("tag").notNull(),
  name: text("name").notNull(),
  body: text("body"),
  url: text("url").notNull(),
  prerelease: boolean("prerelease").notNull().default(false),
  publishedAt: timestamp("published_at"),
  syncedAt: timestamp("synced_at").notNull().defaultNow(),
});
