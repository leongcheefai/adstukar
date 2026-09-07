import { DEVICE_TIERS } from "@repo/db/enums";
import * as z from "zod/v4";

export const rejectInput = z.object({
  reason: z.string().trim().min(1).max(500),
});

/** Approving a device stamps its tier, and the tier sets the rate it earns. */
export const approveDeviceInput = z.object({
  tier: z.enum(DEVICE_TIERS),
});

export type RejectInput = z.infer<typeof rejectInput>;
export type ApproveDeviceInput = z.infer<typeof approveDeviceInput>;
