import { play } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

export const playContract = toWire(
  createSelectSchema(play).pick({
    id: true,
    placementId: true,
    listingId: true,
    house: true,
    state: true,
    scanned: true,
    countedAt: true,
    scannedAt: true,
    createdAt: true,
  }),
);

export type Play = z.output<typeof playContract>;
export type PlayState = Play["state"];
