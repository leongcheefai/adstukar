import { economy } from "@repo/config/economy";
import type { CampaignState, ListingState, SlotState } from "@repo/db/enums";

const HOUR_MS = 3_600_000;

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
  /** The moment this play counts against the day. */
  countedAt: Date;
  /** The first counted play on this device today, or null when this play is it. */
  firstPlayAt: Date | null;
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
  if (!withinPaidHours(input)) return false;
  if (input.slotState !== "running") return false;
  if (input.listingState !== "approved") return false;
  if (input.campaignState !== "active") return false;
  return input.verifiedAt !== null;
}

/**
 * True while the day's paid window is open. It opens at the first play of the
 * day, so a screen earns for the same stretch of hours whatever hour it wakes.
 */
function withinPaidHours(input: Pick<PayableInput, "countedAt" | "firstPlayAt">): boolean {
  if (input.firstPlayAt === null) return true;
  const closesAt = input.firstPlayAt.getTime() + economy.caps.paidHoursPerDay * HOUR_MS;
  return input.countedAt.getTime() < closesAt;
}
