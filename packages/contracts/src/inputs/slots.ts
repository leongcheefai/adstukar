import { economy } from "@repo/config/economy";
import * as z from "zod/v4";
import { httpUrl } from "./campaigns";

/**
 * One booking in one request: the campaign, its one creative, and the
 * position. The server creates all three and charges the price in one
 * transaction, so a short balance leaves nothing behind.
 */
export const bookSlotInput = z.object({
  name: z.string().trim().min(1).max(60),
  url: httpUrl,
  tagline: z.string().trim().min(1).max(economy.taglineMaxLength),
  logoUrl: httpUrl.nullable().optional(),
  position: z.number().int().min(1).max(economy.slot.count),
});

export type BookSlotInput = z.infer<typeof bookSlotInput>;
