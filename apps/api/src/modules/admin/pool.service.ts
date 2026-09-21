import { db, schema } from "@repo/db";
import { and, eq, gte, ne, sql } from "drizzle-orm";
import { startOfUtcWeek } from "../../lib/day";

/** The week's pool before the wire: the route serializes `weekStart`. */
export interface WeekPool {
  weekStart: Date;
  slotRevenue: number;
  earnPosted: number;
}

/**
 * The week's slot revenue against the week's earn. Revenue is capped at the
 * ring; the earn grows with every screen approved. When the second passes the
 * first, a lever moves: the slot price, the pace of approval, or the pace of
 * tier promotion (docs/adr/0010). Both are amounts.
 */
export async function weekPool(now: Date = new Date()): Promise<WeekPool> {
  const weekStart = startOfUtcWeek(now);

  const [revenue] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.slot.amount}), 0)::int` })
    .from(schema.slot)
    .where(and(gte(schema.slot.bookedAt, weekStart), ne(schema.slot.state, "refunded")));

  const [earn] = await db
    .select({ total: sql<number>`coalesce(sum(${schema.ledgerEntry.delta}), 0)::int` })
    .from(schema.ledgerEntry)
    .where(
      and(eq(schema.ledgerEntry.reason, "earn"), gte(schema.ledgerEntry.createdAt, weekStart)),
    );

  return {
    weekStart,
    slotRevenue: revenue?.total ?? 0,
    earnPosted: earn?.total ?? 0,
  };
}
