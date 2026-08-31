import { economy } from "@repo/config/economy";
import type { ListLedgerQuery } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { and, desc, eq, exists, lt, lte, not, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

/**
 * The only module that writes `ledger_entry`. Every point movement is one immutable,
 * idempotent row; balances are derived by summing. Callers pass a `tx` when the
 * movement must commit together with other writes (serve/beacon, approval).
 */

/** Either the pool or an open transaction — both expose the same query builder. */
export type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0] | typeof db;

export type LedgerReason = (typeof schema.LEDGER_REASONS)[number];
export type LedgerState = (typeof schema.LEDGER_STATES)[number];

export interface PostEntryInput {
  userId: string;
  delta: number;
  reason: LedgerReason;
  state: Extract<LedgerState, "pending" | "settled">;
  /** Unique per movement, e.g. `earn:<impressionId>`. A repeat is a no-op. */
  idempotencyKey: string;
  impressionId?: string | null;
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
      state: input.state,
      idempotencyKey: input.idempotencyKey,
      impressionId: input.impressionId ?? null,
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
 * Writes one compensating `expiry` row for every settled earn entry older than the
 * expiry window that has not been expired yet. Idempotent through `expiry:<id>`.
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
    })
    .from(schema.ledgerEntry)
    .where(
      and(
        eq(schema.ledgerEntry.reason, "earn"),
        eq(schema.ledgerEntry.state, "settled"),
        lte(schema.ledgerEntry.settledAt, cutoff),
        not(exists(alreadyExpired)),
      ),
    );

  let count = 0;
  for (const entry of due) {
    const { inserted } = await postEntry(db, {
      userId: entry.userId,
      delta: -entry.delta,
      reason: "expiry",
      state: "settled",
      idempotencyKey: `expiry:${entry.id}`,
      relatedEntryId: entry.id,
      now,
    });
    if (inserted) count += 1;
  }
  return count;
}

/** Admin: void an entry and post the compensating row. */
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
