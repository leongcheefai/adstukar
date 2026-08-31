import { PLACEMENT_SIZES } from "@repo/db/enums";
import * as z from "zod/v4";

// Public shape read by the embed on member sites. Nothing here identifies the owner.
export const servedAdContract = z.object({
  name: z.string(),
  tagline: z.string(),
  logoUrl: z.string().nullable(),
  clickUrl: z.string(),
});

export const serveOutput = z.object({
  impressionId: z.string().nullable(),
  size: z.enum(PLACEMENT_SIZES),
  house: z.boolean(),
  ad: servedAdContract.nullable(),
});

export const beaconOutput = z.object({
  counted: z.boolean(),
});

export type ServedAd = z.output<typeof servedAdContract>;
export type ServeResponse = z.output<typeof serveOutput>;
export type BeaconResponse = z.output<typeof beaconOutput>;
