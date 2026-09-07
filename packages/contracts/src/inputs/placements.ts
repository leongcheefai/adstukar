import { economy } from "@repo/config/economy";
import { PLACEMENT_FORMATS, PLACEMENT_SIZES } from "@repo/db/enums";
import * as z from "zod/v4";

const dwellSeconds = z
  .number()
  .int()
  .min(economy.placement.dwellSeconds.min)
  .max(economy.placement.dwellSeconds.max);

const gapSeconds = z
  .number()
  .int()
  .min(economy.placement.gapSeconds.min)
  .max(economy.placement.gapSeconds.max);

export const createPlacementInput = z.object({
  deviceId: z.string().min(1),
  format: z.enum(PLACEMENT_FORMATS).default("band"),
  size: z.enum(PLACEMENT_SIZES).default("medium"),
  dwellSeconds: dwellSeconds.default(economy.placement.dwellSeconds.default),
  gapSeconds: gapSeconds.default(economy.placement.gapSeconds.default),
});

export const updatePlacementInput = z.object({
  format: z.enum(PLACEMENT_FORMATS).optional(),
  size: z.enum(PLACEMENT_SIZES).optional(),
  dwellSeconds: dwellSeconds.optional(),
  gapSeconds: gapSeconds.optional(),
});

export const listPlacementsQuery = z.object({
  deviceId: z.string().min(1).optional(),
});

export type CreatePlacementInput = z.infer<typeof createPlacementInput>;
export type UpdatePlacementInput = z.infer<typeof updatePlacementInput>;
