import { economy } from "@repo/config/economy";
import { PLACEMENT_SIZES } from "@repo/db/enums";
import * as z from "zod/v4";

export const createPlacementInput = z.object({
  productId: z.string().min(1),
  size: z.enum(PLACEMENT_SIZES).default("small"),
  houseAdPct: z.number().int().min(0).max(100).default(0),
});

export const updatePlacementInput = z.object({
  size: z.enum(PLACEMENT_SIZES).optional(),
  houseAdPct: z.number().int().min(0).max(100).optional(),
});

export const setExcludedTermsInput = z.object({
  phrases: z
    .array(z.string().trim().min(1).max(economy.excludedTerms.maxLength))
    .max(economy.excludedTerms.max),
});

export const listPlacementsQuery = z.object({
  productId: z.string().min(1).optional(),
});

export type CreatePlacementInput = z.infer<typeof createPlacementInput>;
export type UpdatePlacementInput = z.infer<typeof updatePlacementInput>;
export type SetExcludedTermsInput = z.infer<typeof setExcludedTermsInput>;
