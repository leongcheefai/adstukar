import { release } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

// .pick() is an explicit allowlist: a column added to the table never reaches the
// wire by accident. A renamed or dropped column makes this .pick() throw
// "Unrecognized key" at module load — NOT at compile time: TypeScript's excess-property
// check only fires when every masked key is invalid, so a stale key here type-checks fine.
export const releaseContract = toWire(
  createSelectSchema(release).pick({
    id: true,
    tag: true,
    name: true,
    body: true,
    url: true,
    prerelease: true,
    publishedAt: true,
    syncedAt: true,
  }),
);

export type Release = z.output<typeof releaseContract>;
