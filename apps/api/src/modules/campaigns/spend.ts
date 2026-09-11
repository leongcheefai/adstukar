import { schema } from "@repo/db";
import { and, eq, gte, sql } from "drizzle-orm";
import type { Tx } from "../ledger/ledger.service";
import { listingBudgets, startOfUtcDay } from "./pacing";

/**
 * What a campaign has already spent today, and what one listing may still spend.
 *
 * The serve path, the billing path and the dashboard all ask the same question,
 * so they ask it here. A spend is read from the ledger and never from a counter:
 * `ledger_entry` is the only record of a point that moved.
 */

/**
 * Points spent today, keyed by campaign. `campaignId` narrows it to one campaign
 * for the billing path; without it the serve path gets every campaign in one query
 * rather than one query per candidate.
 */
export async function spentTodayByCampaign(
  tx: Tx,
  now: Date,
  campaignId?: string,
): Promise<Map<string, number>> {
  const conditions = [
    eq(schema.ledgerEntry.reason, "spend"),
    gte(schema.ledgerEntry.createdAt, startOfUtcDay(now)),
  ];
  if (campaignId) conditions.push(eq(schema.listing.campaignId, campaignId));

  const rows = await tx
    .select({
      campaignId: schema.listing.campaignId,
      total: sql<number>`coalesce(-sum(${schema.ledgerEntry.delta}), 0)::int`,
    })
    .from(schema.ledgerEntry)
    .innerJoin(schema.play, eq(schema.play.id, schema.ledgerEntry.playId))
    .innerJoin(schema.listing, eq(schema.listing.id, schema.play.listingId))
    .where(and(...conditions))
    .groupBy(schema.listing.campaignId);
  return new Map(rows.map((r) => [r.campaignId, r.total]));
}

/** Points this one campaign has already spent today, as a positive number. */
export async function spentToday(tx: Tx, campaignId: string, now: Date): Promise<number> {
  return (await spentTodayByCampaign(tx, now, campaignId)).get(campaignId) ?? 0;
}

/**
 * Points spent today, keyed by listing. The campaign's budget is split evenly
 * over its listings, so each one is paced against its own share and one creative
 * cannot take the whole day from the other three.
 */
export async function spentTodayByListing(
  tx: Tx,
  now: Date,
  campaignId?: string,
): Promise<Map<string, number>> {
  const conditions = [
    eq(schema.ledgerEntry.reason, "spend"),
    gte(schema.ledgerEntry.createdAt, startOfUtcDay(now)),
  ];
  if (campaignId) conditions.push(eq(schema.listing.campaignId, campaignId));

  const rows = await tx
    .select({
      listingId: schema.listing.id,
      total: sql<number>`coalesce(-sum(${schema.ledgerEntry.delta}), 0)::int`,
    })
    .from(schema.ledgerEntry)
    .innerJoin(schema.play, eq(schema.play.id, schema.ledgerEntry.playId))
    .innerJoin(schema.listing, eq(schema.listing.id, schema.play.listingId))
    .where(and(...conditions))
    .groupBy(schema.listing.id);
  return new Map(rows.map((r) => [r.listingId, r.total]));
}

/** Points this one listing has already spent today, as a positive number. */
export async function spentTodayForListing(
  tx: Tx,
  listingId: string,
  campaignId: string,
  now: Date,
): Promise<number> {
  return (await spentTodayByListing(tx, now, campaignId)).get(listingId) ?? 0;
}

/**
 * The share of the daily budget one listing holds. The share is split over the
 * listings that may run, plus the one being billed: a listing paused after it
 * played still earned the play it is being charged for.
 */
export async function budgetShare(
  tx: Tx,
  campaign: { id: string; dailyBudget: number },
  listingId: string,
): Promise<number> {
  const rows = await tx
    .select({ id: schema.listing.id })
    .from(schema.listing)
    .where(and(eq(schema.listing.campaignId, campaign.id), eq(schema.listing.state, "approved")));

  const ids = rows.map((r) => r.id);
  if (!ids.includes(listingId)) ids.push(listingId);
  return listingBudgets(campaign.dailyBudget, ids).get(listingId) ?? 0;
}
