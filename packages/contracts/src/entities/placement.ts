import { placement } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

// One overlay region on a device. A device may hold several, but only one paid
// listing is on screen at a time.
export const placementContract = toWire(
  createSelectSchema(placement).pick({
    id: true,
    deviceId: true,
    format: true,
    size: true,
    dwellSeconds: true,
    gapSeconds: true,
    createdAt: true,
  }),
);

export type Placement = z.output<typeof placementContract>;
export type PlacementFormat = Placement["format"];
export type PlacementSize = Placement["size"];
