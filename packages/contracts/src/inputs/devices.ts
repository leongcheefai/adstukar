import { economy } from "@repo/config/economy";
import { VENUE_TYPES } from "@repo/db/enums";
import * as z from "zod/v4";

const location = z.string().trim().min(1).max(120);
const name = z.string().trim().min(1).max(80);
const photoUrl = z.url().max(2048);

/**
 * The hours the venue states it is open, in its own time. The payout review
 * counts the plays that fall outside them, so a screen that runs all night in a
 * cafe that shuts at six is visible before cash leaves (docs/adr/0005).
 *
 * Both must arrive together or neither: one hour on its own states no window.
 */
const hour = z.number().int().min(0).max(23);
/** IANA zone, e.g. `Asia/Kuala_Lumpur`. The browser reads it off the screen. */
const timezone = z.string().trim().max(64);

const statedHours = {
  openHour: hour.nullish(),
  closeHour: hour.nullish(),
  timezone: timezone.nullish(),
};

/** One stated hour without the other is not a window, so both go or neither. */
function bothHoursOrNeither<T extends { openHour?: number | null; closeHour?: number | null }>(
  value: T,
): boolean {
  return (
    (value.openHour === null || value.openHour === undefined) ===
    (value.closeHour === null || value.closeHour === undefined)
  );
}

const HOURS_MESSAGE = "State both the opening hour and the closing hour, or neither.";

// The tier, the state and the daily play cap are the admin's to set. A
// distributor describes the screen; approval prices it.
export const createDeviceInput = z
  .object({
    name,
    location,
    venueType: z.enum(VENUE_TYPES).default("other"),
    /**
     * A photo of the screen in place. It is optional here so a distributor can
     * register from a laptop and add the photo from a phone, but an admin has no
     * device to approve until it arrives (docs/adr/0003).
     */
    photoUrl: photoUrl.nullish(),
    ...statedHours,
  })
  .refine(bothHoursOrNeither, { message: HOURS_MESSAGE, path: ["closeHour"] });

export const updateDeviceInput = z
  .object({
    name: name.optional(),
    location: location.optional(),
    venueType: z.enum(VENUE_TYPES).optional(),
    photoUrl: photoUrl.nullish(),
    ...statedHours,
  })
  .refine(bothHoursOrNeither, { message: HOURS_MESSAGE, path: ["closeHour"] });

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
