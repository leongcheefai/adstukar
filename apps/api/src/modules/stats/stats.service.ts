import type { StatsOverview } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { and, count, eq, gte, inArray, sql } from "drizzle-orm";
import type { AnyPgColumn } from "drizzle-orm/pg-core";
import { getBalances } from "../ledger/ledger.service";
import { SERIES_DAYS, dayKey, emptySeries, utcDayStart } from "./series";

export async function getStatsOverview(
  userId: string,
  now: Date = new Date(),
): Promise<StatsOverview> {
  const series = emptySeries(now);
  const since = new Date(utcDayStart(now).getTime() - (SERIES_DAYS - 1) * 86_400_000);
  const day = (col: AnyPgColumn) => sql<string>`to_char(${col} at time zone 'UTC', 'YYYY-MM-DD')`;

  const ownProducts = db
    .select({ id: schema.product.id })
    .from(schema.product)
    .where(eq(schema.product.userId, userId));

  const shownDay = day(schema.impression.viewedAt);
  const shownRows = await db
    .select({ day: shownDay, n: count() })
    .from(schema.impression)
    .innerJoin(schema.placement, eq(schema.placement.id, schema.impression.placementId))
    .where(
      and(
        inArray(schema.placement.productId, ownProducts),
        eq(schema.impression.viewable, true),
        gte(schema.impression.viewedAt, since),
      ),
    )
    .groupBy(shownDay);

  const receivedRows = await db
    .select({ day: shownDay, n: count() })
    .from(schema.impression)
    .where(
      and(
        inArray(schema.impression.servedProductId, ownProducts),
        eq(schema.impression.house, false),
        eq(schema.impression.viewable, true),
        gte(schema.impression.viewedAt, since),
      ),
    )
    .groupBy(shownDay);

  const clickDay = day(schema.impression.clickedAt);
  const clickRows = await db
    .select({ day: clickDay, n: count() })
    .from(schema.impression)
    .where(
      and(
        inArray(schema.impression.servedProductId, ownProducts),
        eq(schema.impression.house, false),
        eq(schema.impression.clicked, true),
        gte(schema.impression.clickedAt, since),
      ),
    )
    .groupBy(clickDay);

  for (const r of shownRows) {
    const s = series.get(r.day);
    if (s) s.shown = r.n;
  }
  for (const r of receivedRows) {
    const s = series.get(r.day);
    if (s) s.received = r.n;
  }
  for (const r of clickRows) {
    const s = series.get(r.day);
    if (s) s.clicks = r.n;
  }

  const todayKey = dayKey(utcDayStart(now));
  const today = series.get(todayKey) ?? { shown: 0, received: 0, clicks: 0 };
  const balance = await getBalances(db, userId);

  return {
    balance,
    today: { ...today, ctr: today.received > 0 ? today.clicks / today.received : 0 },
    series: [...series.entries()].map(([d, v]) => ({ day: d, ...v })),
  };
}
