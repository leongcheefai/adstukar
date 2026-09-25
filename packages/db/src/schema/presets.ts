import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { MEDIA_KINDS } from "./enums";

export const mediaKindEnum = pgEnum("media_kind", MEDIA_KINDS);

/**
 * One picture or clip an admin puts in every member's Images/Video library, so
 * a new set has something to play before its member uploads a thing. No money
 * references a preset, so a delete removes the row.
 *
 * `key` is the object in the bucket, under the `presets/` prefix. The API reads
 * the size and the type off the stored object, never off the request, so a row
 * can only describe a file that is really there.
 */
export const presetMedia = pgTable(
  "preset_media",
  {
    id: text("id").primaryKey(),
    kind: mediaKindEnum("kind").notNull(),
    name: text("name").notNull(),
    key: text("key").notNull(),
    url: text("url").notNull(),
    size: integer("size").notNull(),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("preset_media_key_key").on(t.key),
    index("preset_media_created_at_idx").on(t.createdAt),
  ],
);
