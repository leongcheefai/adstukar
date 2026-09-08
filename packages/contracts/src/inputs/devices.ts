import { economy } from "@repo/config/economy";
import { VENUE_TYPES } from "@repo/db/enums";
import * as z from "zod/v4";

const location = z.string().trim().min(1).max(120);
const name = z.string().trim().min(1).max(80);
const photoUrl = z.url().max(2048);

// The tier, the state and the daily play cap are the admin's to set. A
// distributor describes the screen; approval prices it.
export const createDeviceInput = z.object({
  name,
  location,
  venueType: z.enum(VENUE_TYPES).default("other"),
  /**
   * A photo of the screen in place. It is optional here so a distributor can
   * register from a laptop and add the photo from a phone, but an admin has no
   * device to approve until it arrives (docs/adr/0003).
   */
  photoUrl: photoUrl.nullish(),
});

export const updateDeviceInput = z.object({
  name: name.optional(),
  location: location.optional(),
  venueType: z.enum(VENUE_TYPES).optional(),
  photoUrl: photoUrl.nullish(),
});

export const setExcludedTermsInput = z.object({
  phrases: z
    .array(z.string().trim().min(1).max(economy.excludedTerms.maxLength))
    .max(economy.excludedTerms.max),
});

/**
 * The whole veto list, not one addition. The dashboard shows every eligible
 * listing with a switch beside it, so it always knows the full set and a
 * concurrent edit replaces rather than merges.
 */
export const setVetoedListingsInput = z.object({
  listingIds: z.array(z.string().min(1).max(64)).max(economy.maxVetoesPerDevice),
});

/**
 * The distributor's own promotion. Every field goes together: clearing the
 * tagline clears the promotion, and the loop falls back to the CapyAds card.
 */
export const setPromotionInput = z.object({
  name: z.string().trim().min(1).max(economy.promotion.nameMaxLength).nullish(),
  tagline: z.string().trim().min(1).max(economy.promotion.taglineMaxLength).nullish(),
  url: z.url().max(2048).nullish(),
  logoUrl: photoUrl.nullish(),
});

export type CreateDeviceInput = z.infer<typeof createDeviceInput>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceInput>;
export type SetExcludedTermsInput = z.infer<typeof setExcludedTermsInput>;
export type SetVetoedListingsInput = z.infer<typeof setVetoedListingsInput>;
export type SetPromotionInput = z.infer<typeof setPromotionInput>;
