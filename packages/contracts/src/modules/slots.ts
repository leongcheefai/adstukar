import * as z from "zod/v4";
import { campaignContract } from "../entities/campaign";
import { listingContract } from "../entities/listing";
import { slotContract } from "../entities/slot";

/**
 * A slot travels with its campaign and its one creative. The listing is null
 * only when the member archived the creative under a slot that still runs.
 */
export const slotWithCampaignOutput = z.object({
  slot: slotContract,
  campaign: campaignContract,
  listing: listingContract.nullable(),
});

export const listSlotsOutput = z.object({
  items: z.array(slotWithCampaignOutput),
});

/**
 * One position on the loop, as every screen prints it. `held` is a paid
 * booking whose creative is not on screen yet: the position is taken, and the
 * ticker prints the house card on it. No band carries an id; the dashboard
 * matches its own slots by position.
 */
export const loopBandContract = z.discriminatedUnion("kind", [
  z.object({ position: z.number().int(), kind: z.literal("open") }),
  z.object({ position: z.number().int(), kind: z.literal("held") }),
  z.object({
    position: z.number().int(),
    kind: z.literal("brand"),
    name: z.string(),
    tagline: z.string(),
    logoUrl: z.string().nullable(),
    url: z.string(),
  }),
]);

export const slotAvailabilityContract = z.object({
  total: z.number().int(),
  taken: z.number().int(),
  left: z.number().int(),
});

export const slotLoopOutput = z.object({
  bands: z.array(loopBandContract),
  availability: slotAvailabilityContract,
});

export type SlotWithCampaign = z.output<typeof slotWithCampaignOutput>;
export type LoopBand = z.output<typeof loopBandContract>;
export type SlotAvailability = z.output<typeof slotAvailabilityContract>;
export type SlotLoop = z.output<typeof slotLoopOutput>;
