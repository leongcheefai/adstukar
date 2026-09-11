import { listing } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

// The name and the destination live on the campaign, so a listing carries only
// what changes between variants.
export const listingContract = toWire(
  createSelectSchema(listing).pick({
    id: true,
    campaignId: true,
    tagline: true,
    logoUrl: true,
    state: true,
    rejectionReason: true,
    createdAt: true,
    updatedAt: true,
  }),
);

export type Listing = z.output<typeof listingContract>;
export type ListingState = Listing["state"];
