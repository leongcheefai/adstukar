import { index, integer, pgEnum, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { MEDIA_KINDS } from "./enums";

export const mediaKindEnum = pgEnum("media_kind", MEDIA_KINDS);

/**
 * One wallpaper collection an admin puts on every member's set: a name, the
 * page a click on any of its photos opens, and the photographer to credit.
 * The photos are the `preset_media` rows that point at it.
 */
export const presetCollection = pgTable(
  "preset_collection",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    url: text("url").notNull(),
    author: text("author"),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("preset_collection_created_at_idx").on(t.createdAt)],
);

/**
 * One picture an admin puts in a wallpaper collection. No money references a
 * preset, so a delete removes the row.
 *
 * `key` is the object in the bucket, under the `presets/` prefix. The API reads
 * the size and the type off the stored object, never off the request, so a row
 * can only describe a file that is really there.
 *
 * `collection_id` is null only on a preset that predates collections: the desk
 * shows it apart, and no member sees it until an admin moves it into one.
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
    collectionId: text("collection_id").references(() => presetCollection.id, {
      onDelete: "set null",
    }),
    createdBy: text("created_by").references(() => user.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("preset_media_key_key").on(t.key),
    index("preset_media_created_at_idx").on(t.createdAt),
    index("preset_media_collection_id_idx").on(t.collectionId),
  ],
);
