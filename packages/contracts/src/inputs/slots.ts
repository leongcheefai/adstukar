import { economy } from "@repo/config/economy";
import * as z from "zod/v4";
import { campaignName, httpsUrl } from "./campaigns";

/**
 * One booking in one request: the campaign, its one creative, and the
 * position. The server creates all three and charges the price in one
 * transaction, so a short balance leaves nothing behind.
 */
export const bookSlotInput = z.object({
  name: campaignName,
  url: httpsUrl,
  tagline: z.string().trim().min(1).max(economy.taglineMaxLength),
  logoUrl: httpsUrl.nullable().optional(),
  position: z.number().int().min(1).max(economy.slot.count),
});

export type BookSlotInput = z.infer<typeof bookSlotInput>;

/**
 * An admin gives a slot to a member for nothing (docs/adr/0014). The booking
 * is the member's own, so it names them by the email they signed up with; the
 * rest is what the member would have typed.
 */
export const compSlotInput = bookSlotInput.extend({
  email: z.string().trim().toLowerCase().email(),
});

export type CompSlotInput = z.infer<typeof compSlotInput>;
