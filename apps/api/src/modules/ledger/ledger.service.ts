import { economy } from "@repo/config/economy";
import type { ListLedgerQuery } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { and, desc, eq, exists, inArray, lt, lte, ne, not, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { clampExpiry } from "./expiry";

/**
 * The only module that writes `ledger_entry`. Every point movement is one immutable,
 * idempotent row; balances are derived by summing. Callers pass a `tx` when the
 * movement must commit together with other writes (serve/report, approval).
 *
 * Every row carries a lot. The lot decides the rules, so a caller states it:
 * `bought` refunds and never expires, `earned` withdraws after the hold and
 * expires, `granted` neither refunds nor withdraws, and expires.
 */

/** Either the pool or an open transaction — both expose the same query builder. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export type LedgerReason = (typeof schema.LEDGER_REASONS)[number];
export type LedgerState = (typeof schema.LEDGER_STATES)[number];
export type LedgerLot = (typeof schema.LEDGER_LOTS)[number];

/** A spend takes free points before paid ones. See docs/adr/0001. */
const SPEND_ORDER = ["granted", "bought"] as const satisfies readonly LedgerLot[];

/**
 * Reasons that put points into an account, plus the fee that pairs with an earn.
 * These are the only rows expiry may reverse: reversing a spend would hand the
 * points back.
 */
const EXPIRABLE_REASONS = ["earn", "grant", "fee"] as const satisfies readonly LedgerReason[];

export interface PostEntryInput {
  userId: string;
  delta: number;
  reason: LedgerReason;
  lot: LedgerLot;
  state: Extract<LedgerState, "pending" | "settled">;
  /** Unique per movement, e.g. `earn:<playId>`. A repeat is a no-op. */
  idempotencyKey: string;
  playId?: string | null;
  relatedEntryId?: string | null;
  settlesAt?: Date | null;
  now?: Date;
}

export async function postEntry(tx: Tx, input: PostEntryInput): Promise<{ inserted: boolean }> {
  const now = input.now ?? new Date();
  const rows = await tx
    .insert(schema.ledgerEntry)
    .values({
      id: crypto.randomUUID(),
      userId: input.userId,
      delta: input.delta,
      reason: input.reason,
      lot: input.lot,
      state: input.state,
      idempotencyKey: input.idempotencyKey,
      playId: input.playId ?? null,
      relatedEntryId: input.relatedEntryId ?? null,
      createdAt: now,
      settlesAt: input.state === "pending" ? (input.settlesAt ?? null) : null,
      settledAt: input.state === "settled" ? now : null,
    })
    .onConflictDoNothing({ target: schema.ledgerEntry.idempotencyKey })
    .returning({ id: schema.ledgerEntry.id });
  return { inserted: rows.length > 0 };
}

export function settlesAtFrom(now: Date): Date {
  return new Date(now.getTime() + economy.settlementDelayHours * 3_600_000);
}

export interface Balances {
  settled: number;
  pending: number;
}

export async function getBalances(tx: Tx, userId: string): Promise<Balances> {
  const [row] = await tx
    .select({
      settled: sql<number>`coalesce(sum(${schema.ledgerEntry.delta}) filter (where ${schema.ledgerEntry.state} = 'settled'), 0)::int`,
      pending: sql<number>`coalesce(sum(${schema.ledgerEntry.delta}) filter (where ${schema.ledgerEntry.state} = 'pending'), 0)::int`,
    })
    .from(schema.ledgerEntry)
    .where(eq(schema.ledgerEntry.userId, userId));
  return { settled: row?.settled ?? 0, pending: row?.pending ?? 0 };
}

export type LotBalances = Record<LedgerLot, number>;

/** Settled points per lot. What a spend may draw on, split by the rules that bind it. */
export async function getLotBalances(tx: Tx, userId: string): Promise<LotBalances> {
  const rows = await tx
    .select({
      lot: schema.ledgerEntry.lot,
      total: sql<number>`coalesce(sum(${schema.ledgerEntry.delta}), 0)::int`,
    })
    .from(schema.ledgerEntry)
    .where(and(eq(schema.ledgerEntry.userId, userId), eq(schema.ledgerEntry.state, "settled")))
    .groupBy(schema.ledgerEntry.lot);

  const balances: LotBalances = { bought: 0, earned: 0, granted: 0 };
  for (const row of rows) balances[row.lot] = row.total;
  return balances;
}

/** What an advertiser may still spend: the granted and bought lots, never the earned one. */
export function spendable(balances: LotBalances): number {
  return SPEND_ORDER.reduce((sum, lot) => sum + Math.max(0, balances[lot]), 0);
}

/**
 * Spendable points for every member at once, for the serve path's candidate scan.
 * It lives here rather than in the serve module so `SPEND_ORDER` stays the one
 * place that decides which lots a spend may draw on.
 */
export async function spendableByUser(): Promise<Map<string, number>> {
  const rows = await db
    .select({
      userId: schema.ledgerEntry.userId,
      lot: schema.ledgerEntry.lot,
      total: sql<number>`coalesce(sum(${schema.ledgerEntry.delta}), 0)::int`,
    })
    .from(schema.ledgerEntry)
    .where(eq(schema.ledgerEntry.state, "settled"))
    .groupBy(schema.ledgerEntry.userId, schema.ledgerEntry.lot);

  const spendableLots = new Set<LedgerLot>(SPEND_ORDER);
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (!spendableLots.has(row.lot)) continue;
    totals.set(row.userId, (totals.get(row.userId) ?? 0) + Math.max(0, row.total));
  }
  return totals;
}

export interface PostSpendInput {
  userId: string;
  /** Points to take. Always positive. */
  amount: number;
  reason: Extract<LedgerReason, "spend">;
  /** The lot is appended, so one spend across two lots keys two distinct rows. */
  idempotencyKey: string;
  playId?: string | null;
  now?: Date;
}

/**
 * Takes points from the granted lot first, then the bought lot. Points inside one
 * lot are fungible, so "oldest first" needs no per-entry consumption record —
 * age only decides expiry, which already works entry by entry.
 *
 * Returns what it actually took. A caller that asked for more than the account
 * holds must treat a short result as a refusal and roll its transaction back.
 */
export async function postSpend(tx: Tx, input: PostSpendInput): Promise<{ posted: number }> {
  const balances = await getLotBalances(tx, input.userId);
  let left = input.amount;

  for (const lot of SPEND_ORDER) {
    if (left <= 0) break;
    const take = Math.min(left, Math.max(0, balances[lot]));
    if (take <= 0) continue;
    await postEntry(tx, {
      userId: input.userId,
      delta: -take,
      reason: input.reason,
      lot,
      state: "settled",
      idempotencyKey: `${input.idempotencyKey}:${lot}`,
      playId: input.playId ?? null,
      now: input.now,
    });
    left -= take;
  }

  return { posted: input.amount - left };
}

/** Moves every due pending entry to settled. Returns the number of rows touched. */
export async function settleDue(now: Date = new Date()): Promise<number> {
  const rows = await db
    .update(schema.ledgerEntry)
    .set({ state: "settled", settledAt: now })
    .where(and(eq(schema.ledgerEntry.state, "pending"), lte(schema.ledgerEntry.settlesAt, now)))
    .returning({ id: schema.ledgerEntry.id });
  return rows.length;
}

/**
 * Writes one compensating `expiry` row for every settled earn, grant or fee entry
 * older than the expiry window that has not been expired yet. Idempotent through
 * `expiry:<id>`.
 *
 * The bought lot is excluded at the query level: somebody paid money for those
 * points, and expiring them is a consumer-law problem.
 *
 * Expiry takes back only what the lot still holds. Reversing an entry in full
 * would charge twice for points the member already spent, and would drive the lot
 * negative — which then reads as a debt the member never owed.
 */
export async function expireDue(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now);
  cutoff.setUTCMonth(cutoff.getUTCMonth() - economy.expiryMonths);

  const expiry = alias(schema.ledgerEntry, "expiry");
  const alreadyExpired = db
    .select({ id: expiry.id })
    .from(expiry)
    .where(and(eq(expiry.reason, "expiry"), eq(expiry.relatedEntryId, schema.ledgerEntry.id)));

  const due = await db
    .select({
      id: schema.ledgerEntry.id,
      userId: schema.ledgerEntry.userId,
      delta: schema.ledgerEntry.delta,
      lot: schema.ledgerEntry.lot,
    })
    .from(schema.ledgerEntry)
    .where(
      and(
        inArray(schema.ledgerEntry.reason, [...EXPIRABLE_REASONS]),
        ne(schema.ledgerEntry.lot, "bought"),
        eq(schema.ledgerEntry.state, "settled"),
        lte(schema.ledgerEntry.settledAt, cutoff),
        not(exists(alreadyExpired)),
      ),
    );

  // What each lot still holds, read once per member and then kept in step as the
  // rows below take from it.
  const remaining = new Map<string, number>();
  async function left(userId: string, lot: LedgerLot): Promise<number> {
    const key = `${userId}:${lot}`;
    const held = remaining.get(key);
    if (held !== undefined) return held;
    const balances = await getLotBalances(db, userId);
    for (const [name, total] of Object.entries(balances)) {
      remaining.set(`${userId}:${name}`, total);
    }
    return balances[lot];
  }

  let count = 0;
  for (const entry of due) {
    // A fee is a debit, so it expires by giving its points back and the lot grows.
    // Only a credit can be clamped, and only down to what the lot still holds.
    const held = await left(entry.userId, entry.lot);
    const take = clampExpiry(entry.delta, held);

    // A zero row still goes in. It says the entry expired and nothing was left to
    // take, and it is what stops the entry coming back round on the next run to
    // expire against points the member has earned since.
    const { inserted } = await postEntry(db, {
      userId: entry.userId,
      delta: -take,
      reason: "expiry",
      lot: entry.lot,
      state: "settled",
      idempotencyKey: `expiry:${entry.id}`,
      relatedEntryId: entry.id,
      now,
    });
    if (inserted) {
      remaining.set(`${entry.userId}:${entry.lot}`, held - take);
      count += 1;
    }
  }
  return count;
}

/** Admin: void an entry and post the compensating row on the same lot. */
export async function voidEntry(entryId: string, now: Date = new Date()): Promise<boolean> {
  return db.transaction(async (tx) => {
    const [entry] = await tx
      .select()
      .from(schema.ledgerEntry)
      .where(and(eq(schema.ledgerEntry.id, entryId), not(eq(schema.ledgerEntry.state, "void"))))
      .limit(1);
    if (!entry) return false;
    await tx
      .update(schema.ledgerEntry)
      .set({ state: "void" })
      .where(eq(schema.ledgerEntry.id, entryId));
    await postEntry(tx, {
      userId: entry.userId,
      delta: -entry.delta,
      reason: "void",
      lot: entry.lot,
      state: "settled",
      idempotencyKey: `void:${entry.id}`,
      relatedEntryId: entry.id,
      now,
    });
    return true;
  });
}

export async function listEntries(userId: string, query: ListLedgerQuery) {
  const cursorDate = query.cursor ? new Date(query.cursor) : null;
  const conditions = [eq(schema.ledgerEntry.userId, userId)];
  if (query.reason) conditions.push(eq(schema.ledgerEntry.reason, query.reason));
  if (query.state) conditions.push(eq(schema.ledgerEntry.state, query.state));
  if (query.lot) conditions.push(eq(schema.ledgerEntry.lot, query.lot));
  if (cursorDate && !Number.isNaN(cursorDate.getTime())) {
    conditions.push(lt(schema.ledgerEntry.createdAt, cursorDate));
  }

  const rows = await db
    .select()
    .from(schema.ledgerEntry)
    .where(and(...conditions))
    .orderBy(desc(schema.ledgerEntry.createdAt))
    .limit(query.limit + 1);

  const hasMore = rows.length > query.limit;
  const items = hasMore ? rows.slice(0, query.limit) : rows;
  const last = items.at(-1);
  return {
    items,
    nextCursor: hasMore && last ? last.createdAt.toISOString() : null,
  };
}
