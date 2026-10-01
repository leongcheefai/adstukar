import type { LoopBand } from "@repo/contracts";
import { matchesExcludedTerm } from "./ranking";

/**
 * The ring as a registered set plays it (docs/adr/0016). One brand crossing the
 * crawl is one play, so a lap opens one play per paid brand. Everything here is
 * pure: the service fetches the rows and opens the plays, this file decides which
 * band pays and which the device refuses.
 */

/** One live slot, with what decides whether this screen is paid for it. */
export interface RingSlot {
  position: number;
  /** The slot's creative. Null when the campaign holds no live creative. */
  listingId: string | null;
  /** The account that booked it. A screen is never paid for its owner's own brand. */
  userId: string;
  /** The domain check passed. An unverified campaign pays nothing (`payable.ts`). */
  verified: boolean;
}

/** What the distributor refuses on this device. */
export interface RingFilters {
  phrases: string[];
  vetoed: Set<string>;
}

type BrandBand = Extract<LoopBand, { kind: "brand" }>;

/** A band of one lap, with the listing its play opens on, or null when it pays nothing. */
export type PlannedBand = Exclude<LoopBand, BrandBand> | (BrandBand & { listingId: string | null });

export interface PlanRingLapInput {
  /** The ring in position order, as `/slots/loop` prints it. */
  bands: LoopBand[];
  slots: RingSlot[];
  /** The device's owner. */
  ownerId: string;
  filters: RingFilters;
}

/**
 * One lap of the ring for one device. A brand the device refuses prints as open,
 * because a veto means "not on my screen". A brand the device may show but is
 * never paid for (its owner's own, or an unverified domain) keeps its band and
 * opens no play.
 */
export function planRingLap(input: PlanRingLapInput): PlannedBand[] {
  const byPosition = new Map(input.slots.map((s) => [s.position, s]));
  return input.bands.map((band): PlannedBand => {
    if (band.kind !== "brand") return band;
    const slot = byPosition.get(band.position);
    const listingId = slot?.listingId ?? null;
    if (listingId !== null && input.filters.vetoed.has(listingId)) {
      return { position: band.position, kind: "open" };
    }
    if (matchesExcludedTerm(band.name, band.tagline, input.filters.phrases)) {
      return { position: band.position, kind: "open" };
    }
    const pays =
      slot !== undefined && listingId !== null && slot.verified && slot.userId !== input.ownerId;
    return { ...band, listingId: pays ? listingId : null };
  });
}
