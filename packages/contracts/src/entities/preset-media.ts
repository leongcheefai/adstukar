import { presetMedia } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

/**
 * One preset as a member's library and the admin desk both read it. The bucket
 * key and the admin who added it stay off the wire: the public URL is all a
 * screen needs, and the desk addresses a preset by its id.
 */
export const presetMediaContract = toWire(
  createSelectSchema(presetMedia).pick({
    id: true,
    kind: true,
    name: true,
    url: true,
    size: true,
    createdAt: true,
  }),
);

export type PresetMedia = z.output<typeof presetMediaContract>;
export type MediaKind = PresetMedia["kind"];
