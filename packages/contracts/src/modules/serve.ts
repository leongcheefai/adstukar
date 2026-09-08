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

/**
 * The distributor's own promotion, shown when nothing paid is eligible. It has
 * no `scanUrl`, because it moves no points: the code on screen goes straight to
 * the distributor's own address and never through a play.
 */
export const promotionContract = z.object({
  name: z.string(),
  tagline: z.string(),
  logoUrl: z.string().nullable(),
  url: z.string().nullable(),
});

const servedPlay = {
  playId: z.string().nullable(),
  format: z.enum(PLACEMENT_FORMATS),
  size: z.enum(PLACEMENT_SIZES),
  dwellSeconds: z.number().int(),
  gapSeconds: z.number().int(),
  house: z.boolean(),
  listing: servedListingContract.nullable(),
  /**
   * Set only on a house play, and only when the distributor wrote one. CapyTV
   * shows the CapyAds card instead when it is null.
   */
  promotion: promotionContract.nullable(),
};

export const serveOutput = z.object(servedPlay);

/** One play inside a cached batch. It also carries when it stops being reportable. */
export const loopItemContract = z.object({
  ...servedPlay,
  playId: z.string(),
  expiresAt: z.iso.datetime(),
});

/**
 * A batch of plays CapyTV holds so the screen keeps running with no network.
 * Every item is already open, so the device only has to report each one.
 */
export const loopOutput = z.object({
  items: z.array(loopItemContract),
});

export const reportOutput = z.object({
  counted: z.boolean(),
});

export type ServedListing = z.output<typeof servedListingContract>;
export type Promotion = z.output<typeof promotionContract>;
export type ServeResponse = z.output<typeof serveOutput>;
export type LoopItem = z.output<typeof loopItemContract>;
export type LoopResponse = z.output<typeof loopOutput>;
export type ReportResponse = z.output<typeof reportOutput>;
