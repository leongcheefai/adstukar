import { presetCollection } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

/**
 * One wallpaper collection as the set and the admin desk both read it. The
 * admin who made it stays off the wire.
 */
export const presetCollectionContract = toWire(
  createSelectSchema(presetCollection).pick({
    id: true,
    name: true,
    url: true,
    author: true,
    createdAt: true,
  }),
);

export type PresetCollection = z.output<typeof presetCollectionContract>;
