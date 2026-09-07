import { economy } from "@repo/config/economy";
import { VENUE_TYPES } from "@repo/db/enums";
import * as z from "zod/v4";

const location = z.string().trim().min(1).max(120);

// The tier, the state and the daily play cap are the admin's to set. A
// distributor describes the screen; approval prices it.
export const createDeviceInput = z.object({
  location,
  venueType: z.enum(VENUE_TYPES).default("other"),
});

export const updateDeviceInput = z.object({
  location: location.optional(),
  venueType: z.enum(VENUE_TYPES).optional(),
});

export const setExcludedTermsInput = z.object({
  phrases: z
    .array(z.string().trim().min(1).max(economy.excludedTerms.maxLength))
    .max(economy.excludedTerms.max),
});

export type CreateDeviceInput = z.infer<typeof createDeviceInput>;
export type UpdateDeviceInput = z.infer<typeof updateDeviceInput>;
export type SetExcludedTermsInput = z.infer<typeof setExcludedTermsInput>;
