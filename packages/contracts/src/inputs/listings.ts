import { economy } from "@repo/config/economy";
import { OWNER_LISTING_STATES } from "@repo/db/enums";
import * as z from "zod/v4";
import { httpUrl } from "./campaigns";

const tagline = z.string().trim().min(1).max(economy.taglineMaxLength);

export const createListingInput = z.object({
  campaignId: z.string().min(1),
  tagline,
  logoUrl: httpUrl.nullable().optional(),
});

// `state` takes only the two an advertiser owns. A person reviews the creative,
// so `pending`, `rejected` and `archived` are never offered here.
export const updateListingInput = z.object({
  tagline: tagline.optional(),
  logoUrl: httpUrl.nullable().optional(),
  state: z.enum(OWNER_LISTING_STATES).optional(),
});

export const listListingsQuery = z.object({
  campaignId: z.string().min(1).optional(),
});

export type CreateListingInput = z.infer<typeof createListingInput>;
export type UpdateListingInput = z.infer<typeof updateListingInput>;
