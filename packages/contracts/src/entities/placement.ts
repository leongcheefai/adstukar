import { placement } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

// Owner routes only: `apiKey` is a credential for the serve endpoint and must never
// reach a non-owner.
export const placementContract = toWire(
  createSelectSchema(placement).pick({
    id: true,
    productId: true,
    apiKey: true,
    size: true,
    houseAdPct: true,
    createdAt: true,
  }),
);

export type Placement = z.output<typeof placementContract>;
export type PlacementSize = Placement["size"];
