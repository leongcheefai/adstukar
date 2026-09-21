import type { CampaignState, ListingState, SlotState } from "@repo/db/enums";

/**
 * Everything the report reads before it pays a play. Nothing is priced when a
 * play is served: a batch is cut hours before its last play is reported, and
 * what was eligible then may not be now. The play still showed and still
 * counts; it simply pays nothing.
 */
export interface PayableInput {
  house: boolean;
  /** Paid plays this device already counted today, before this one. */
  paidToday: number;
  dailyPlayCap: number;
  /** The live slot on the listing's campaign, or null when there is none. */
  slotState: SlotState | null;
  listingState: ListingState;
  campaignState: CampaignState;
  verifiedAt: Date | null;
}

/** True when the platform pays the distributor for this play (docs/adr/0010). */
export function playPays(input: PayableInput): boolean {
  if (input.house) return false;
  if (input.paidToday >= input.dailyPlayCap) return false;
  if (input.slotState !== "running") return false;
  if (input.listingState !== "approved") return false;
  if (input.campaignState !== "active") return false;
  return input.verifiedAt !== null;
}
