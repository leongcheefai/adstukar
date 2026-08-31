import * as z from "zod/v4";

export const serveQuery = z.object({
  key: z.string().min(1).max(128),
});

export const beaconInput = z.object({
  impressionId: z.string().min(1).max(64),
  key: z.string().min(1).max(128),
});

export type BeaconInput = z.infer<typeof beaconInput>;
