import type { StatsOverview } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { and, count, eq, gte, inArray, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { getBalances, getLotBalances } from "../ledger/ledger.service";
import { type DayCounts, SERIES_DAYS, dayKey, emptySeries, utcDayStart } from "./series";

export async function getStatsOverview(
  userId: string,
  now: Date = new Date(),
): Promise<StatsOverview> {
  const series = emptySeries(now);
  const since = new Date(utcDayStart(now).getTime() - (SERIES_DAYS - 1) * 86_400_000);
  const day = (col: AnyPgColumn) => sql<string>`to_char(${col} at time zone 'UTC', 'YYYY-MM-DD')`;

  const ownPlacements = db
    .select({ id: schema.placement.id })
    .from(schema.placement)
    .innerJoin(schema.device, eq(schema.device.id, schema.placement.deviceId))
    .where(eq(schema.device.userId, userId));

  const ownListings = db
    .select({ id: schema.listing.id })
    .from(schema.listing)
    .innerJoin(schema.campaign, eq(schema.campaign.id, schema.listing.campaignId))
    .where(eq(schema.campaign.userId, userId));

  const countedDay = day(schema.play.countedAt);

  // Plays this member's own devices ran, house cards included: the distributor
  // wants to know what the screen did, not only what it was paid for.
  const playedRows = await db
    .select({ day: countedDay, n: count() })
    .from(schema.play)
    .where(
      and(
        inArray(schema.play.placementId, ownPlacements),
        eq(schema.play.state, "counted"),
        gte(schema.play.countedAt, since),
      ),
    )
    .groupBy(countedDay);

  const receivedRows = await db
    .select({ day: countedDay, n: count() })
    .from(schema.play)
    .where(
      and(
        inArray(schema.play.listingId, ownListings),
        eq(schema.play.house, false),
        eq(schema.play.state, "counted"),
        gte(schema.play.countedAt, since),
      ),
    )
    .groupBy(countedDay);

  const scannedDay = day(schema.play.scannedAt);
  const scanRows = await db
    .select({ day: scannedDay, n: count() })
    .from(schema.play)
    .where(
      and(
        inArray(schema.play.listingId, ownListings),
        eq(schema.play.house, false),
        eq(schema.play.scanned, true),
        gte(schema.play.scannedAt, since),
      ),
    )
    .groupBy(scannedDay);

  // The earn and the fee are two rows on one movement, so summing both gives the
  // number the distributor actually keeps.
  const earnedDay = day(schema.ledgerEntry.createdAt);
  const earnedRows = await db
    .select({
      day: earnedDay,
      total: sql<number>`coalesce(sum(${schema.ledgerEntry.delta}), 0)::int`,
    })
    .from(schema.ledgerEntry)
    .where(
      and(
        eq(schema.ledgerEntry.userId, userId),
        inArray(schema.ledgerEntry.reason, ["earn", "fee"]),
        gte(schema.ledgerEntry.createdAt, since),
      ),
    )
    .groupBy(earnedDay);

  // A row whose day falls outside the window is dropped: the scaffold decides the
  // span, not the query.
  function fill(rows: { day: string; value: number }[], field: keyof DayCounts) {
    for (const row of rows) {
      const day = series.get(row.day);
      if (day) day[field] = row.value;
    }
  }

  fill(
    playedRows.map((r) => ({ day: r.day, value: r.n })),
    "played",
  );
  fill(
    receivedRows.map((r) => ({ day: r.day, value: r.n })),
    "received",
  );
  fill(
    scanRows.map((r) => ({ day: r.day, value: r.n })),
    "scans",
  );
  fill(
    earnedRows.map((r) => ({ day: r.day, value: r.total })),
    "earned",
  );

  const todayKey = dayKey(utcDayStart(now));
  const today = series.get(todayKey) ?? { played: 0, received: 0, scans: 0, earned: 0 };
  const balance = await getBalances(db, userId);
  const lots = await getLotBalances(db, userId);

  return {
    balance: { ...balance, ...lots },
    today: {
      ...today,
      scanRate: today.received > 0 ? today.scans / today.received : 0,
    },
    series: [...series.entries()].map(([d, v]) => ({ day: d, ...v })),
  };
}

const NETWORK_PLAYS_TTL_MS = 30_000;
let networkPlaysCache: { plays: number; at: number } | null = null;

/**
 * Counted paid plays on the whole network. House cards do not count: they
 * move no money, and the number on the marketing site is for advertisers.
 */
export async function getNetworkPlays(): Promise<number> {
  const now = Date.now();
  if (networkPlaysCache && now - networkPlaysCache.at < NETWORK_PLAYS_TTL_MS) {
    return networkPlaysCache.plays;
  }

  const [row] = await db
    .select({ n: count() })
    .from(schema.play)
    .where(and(eq(schema.play.state, "counted"), eq(schema.play.house, false)));

  const plays = Number(row?.n ?? 0);
  networkPlaysCache = { plays, at: now };
  return plays;
}
