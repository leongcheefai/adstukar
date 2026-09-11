import { playRateRange } from "@repo/config/economy";
import type { CampaignPauseReason } from "@repo/db/enums";

/**
 * Pure pacing rules. A campaign runs while its budget and its purse can still
 * pay for a play, and it stops itself the moment neither can. Nothing here reads
 * the database, so the rules are testable on their own and the service below
 * only has to fetch the numbers.
 */

/** The least any play can cost. Below this, a budget or a purse buys nothing. */
export function cheapestPlay(): number {
  return playRateRange().lowest;
}

export function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Splits a daily budget over the listings that share it. The shares are even,
 * and the remainder goes to the first listings, so they always add up to the
 * budget. Nothing is lost to rounding, and the campaign can spend all of it.
 */
export function splitBudget(dailyBudget: number, listings: number): number[] {
  if (listings <= 0) return [];
  const share = Math.floor(dailyBudget / listings);
  const remainder = dailyBudget - share * listings;
  return Array.from({ length: listings }, (_, index) => share + (index < remainder ? 1 : 0));
}

/**
 * The share each listing holds. The ids are sorted first, so one listing gets
 * the same share whatever order the query returned.
 */
export function listingBudgets(dailyBudget: number, listingIds: string[]): Map<string, number> {
  const ordered = [...listingIds].sort();
  const shares = splitBudget(dailyBudget, ordered.length);
  return new Map(ordered.map((id, index) => [id, shares[index] ?? 0]));
}

/**
 * Splits each campaign's daily budget over the listings given for it. The serve
 * path hands it every listing that may run right now, so a listing that has
 * spent its share sits out the rest of the day while its siblings carry on.
 */
export function shareByListing(
  rows: { listingId: string; campaignId: string; dailyBudget: number }[],
): Map<string, number> {
  const byCampaign = new Map<string, { dailyBudget: number; listingIds: string[] }>();
  for (const row of rows) {
    const group = byCampaign.get(row.campaignId) ?? {
      dailyBudget: row.dailyBudget,
      listingIds: [],
    };
    group.listingIds.push(row.listingId);
    byCampaign.set(row.campaignId, group);
  }

  const shares = new Map<string, number>();
  for (const group of byCampaign.values()) {
    for (const [id, share] of listingBudgets(group.dailyBudget, group.listingIds)) {
      shares.set(id, share);
    }
  }
  return shares;
}

/**
 * True when what is left of the budget cannot buy the cheapest play. A campaign
 * with three points left is finished for the day, so it says so rather than
 * standing as running and serving nothing.
 */
export function outOfBudget(spentToday: number, dailyBudget: number): boolean {
  return dailyBudget - spentToday < cheapestPlay();
}

/**
 * True when the purse cannot pay for one play. An empty purse is the common
 * case; a purse holding less than the cheapest play is the same thing.
 */
export function outOfPoints(spendable: number): boolean {
  return spendable < cheapestPlay();
}

export interface ResumeInput {
  reason: CampaignPauseReason | null;
  pausedAt: Date | null;
  /** The owner's spendable points, right now. */
  spendable: number;
  now: Date;
}

/**
 * True when the system may start this campaign again.
 *
 * The budget resets at the start of the UTC day, so a budget pause lifts on the
 * next day — but only when the owner can still pay, or it would stop again on
 * its first play. A balance pause lifts as soon as the purse covers one play.
 *
 * A campaign a person paused carries no reason, and only that person starts it.
 */
export function readyToResume(input: ResumeInput): boolean {
  if (input.reason === null || input.pausedAt === null) return false;
  if (outOfPoints(input.spendable)) return false;
  if (input.reason === "balance") return true;
  return input.pausedAt < startOfUtcDay(input.now);
}
