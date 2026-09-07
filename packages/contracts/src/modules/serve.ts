import { PLACEMENT_FORMATS, PLACEMENT_SIZES } from "@repo/db/enums";
import * as z from "zod/v4";

// Public shape read by CapyTV on a member's screen. Nothing here identifies the
// advertiser's account, and no token travels with it.
export const servedListingContract = z.object({
  name: z.string(),
  tagline: z.string(),
  logoUrl: z.string().nullable(),
  /** The URL behind the code on screen. A viewer who scans it lands on the site. */
  scanUrl: z.string(),
});

export const serveOutput = z.object({
  playId: z.string().nullable(),
  format: z.enum(PLACEMENT_FORMATS),
  size: z.enum(PLACEMENT_SIZES),
  dwellSeconds: z.number().int(),
  gapSeconds: z.number().int(),
  house: z.boolean(),
  listing: servedListingContract.nullable(),
});

export const reportOutput = z.object({
  counted: z.boolean(),
});

export type ServedListing = z.output<typeof servedListingContract>;
export type ServeResponse = z.output<typeof serveOutput>;
export type ReportResponse = z.output<typeof reportOutput>;
