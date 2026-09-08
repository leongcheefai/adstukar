import { economy } from "@repo/config/economy";
import type { SavePayoutAccountInput } from "@repo/contracts";
import { db, schema } from "@repo/db";
import type { PayoutBlock } from "@repo/db/enums";
import { and, count, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { HTTPException } from "hono/http-exception";
import { type Tx, postEntry, voidEntry } from "../ledger/ledger.service";
import { DAY_MS, holdCutoff, payoutAmount, payoutBlock, withdrawable } from "./eligibility";
import {
  type DeviceFlags,
  type DeviceStat,
  countBy,
  flagDevice,
  normaliseLocation,
} from "./review";

/**
 * The database side of a payout. A distributor asks, an admin reads the history
 * behind the request, and either the money leaves or the points come back. The
 * rules themselves are pure and live in `eligibility.ts` and `review.ts`.
 *
 * Payout is manual for the MVP: an admin pays by hand in one monthly session and
 * types the reference back in. See docs/adr/0005.
 */

/** What a member is told when their request cannot go ahead. */
const BLOCK_MESSAGE: Record<PayoutBlock, string> = {
  "open-request": "A payout is already under review.",
  identity: "Add your payout details before you cash out.",
  "below-minimum": `A payout takes at least ${economy.payout.minimumPoints.toLocaleString()} CapyPoints.`,
};

/**
 * Holds one member's purse for the rest of the transaction, so a payout and a
 * charge against the same account queue instead of racing. It takes the same
 * lock the serve path takes, keyed on the member.
 */
async function lockMember(tx: Tx, userId: string): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${userId}))`);
}

/**
 * What one member may take out as money: earned credits that have served the
 * hold, less every debit already on that lot.
 *
 * A debit counts whatever its age, and a credit only once it has matured. The
 * asymmetry is deliberate: an open payout debits the lot today, and waiting out
 * a second hold before it counted would let one balance answer two requests.
 *
 * The reversal of a payout is the one credit that counts before the cutoff. It
 * gives back points that already served the hold once, and a second hold on them
 * would punish a member for a refusal that was not theirs. The exemption is
 * narrow on purpose: the reversal of anything else — a voided fee, say — serves
 * the hold like any other credit.
 */
export async function getWithdrawable(
  tx: Tx,
  userId: string,
  now: Date = new Date(),
): Promise<number> {
  // The cutoff goes through `lte` rather than straight into the template: a raw
  // Date in a `sql` fragment reaches the driver unmapped and throws.
  const matured = lte(schema.ledgerEntry.settledAt, holdCutoff(now));
  // The row each entry reverses, if it reverses one. `relatedEntryId` points at a
  // primary key, so the join can never multiply a row.
  const reversed = alias(schema.ledgerEntry, "reversed");
  const reversesPayout = eq(reversed.reason, "payout");

  const [row] = await tx
    .select({
      matured: sql<number>`coalesce(sum(${schema.ledgerEntry.delta}) filter (
        where ${schema.ledgerEntry.delta} > 0 and (${matured} or ${reversesPayout})
      ), 0)::int`,
      debits: sql<number>`coalesce(sum(${schema.ledgerEntry.delta}) filter (
        where ${schema.ledgerEntry.delta} < 0
      ), 0)::int`,
    })
    .from(schema.ledgerEntry)
    .leftJoin(reversed, eq(reversed.id, schema.ledgerEntry.relatedEntryId))
    .where(
      and(
        eq(schema.ledgerEntry.userId, userId),
        eq(schema.ledgerEntry.lot, "earned"),
        eq(schema.ledgerEntry.state, "settled"),
      ),
    );
  return withdrawable(row?.matured ?? 0, row?.debits ?? 0);
}

async function findAccount(tx: Tx, userId: string) {
  const [row] = await tx
    .select()
    .from(schema.payoutAccount)
    .where(eq(schema.payoutAccount.userId, userId))
    .limit(1);
  return row ?? null;
}

async function countOpenRequests(tx: Tx, userId: string): Promise<number> {
  const [row] = await tx
    .select({ n: count() })
    .from(schema.payoutRequest)
    .where(
      and(eq(schema.payoutRequest.userId, userId), eq(schema.payoutRequest.state, "requested")),
    );
  return row?.n ?? 0;
}

async function listRequests(tx: Tx, userId: string) {
  return tx
    .select()
    .from(schema.payoutRequest)
    .where(eq(schema.payoutRequest.userId, userId))
    .orderBy(desc(schema.payoutRequest.createdAt))
    .limit(50);
}

/** Everything the cash-out panel needs: what may leave, and what already asked to. */
export async function getPayoutOverview(userId: string, now: Date = new Date()) {
  const [account, available, open, requests] = await Promise.all([
    findAccount(db, userId),
    getWithdrawable(db, userId, now),
    countOpenRequests(db, userId),
    listRequests(db, userId),
  ]);

  return {
    account,
    withdrawable: available,
    minimumPoints: economy.payout.minimumPoints,
    holdDays: economy.payout.holdDays,
    block: payoutBlock({
      withdrawable: available,
      hasAccount: account !== null,
      hasOpenRequest: open > 0,
    }),
    requests,
  };
}

/**
 * Identity on file. One account per member, replaced rather than versioned.
 *
 * It is frozen while a request is under review. An admin reads the destination
 * off the queue and then sends the money by hand, so a change between the two
 * would send it to an account nobody reviewed.
 */
export async function savePayoutAccount(
  userId: string,
  input: SavePayoutAccountInput,
  now: Date = new Date(),
) {
  return db.transaction(async (tx) => {
    await lockMember(tx, userId);
    if ((await countOpenRequests(tx, userId)) > 0) {
      throw new HTTPException(409, {
        message: "A payout is under review. Wait for it before you change these details.",
      });
    }

    const [row] = await tx
      .insert(schema.payoutAccount)
      .values({ id: crypto.randomUUID(), userId, ...input, createdAt: now, updatedAt: now })
      .onConflictDoUpdate({
        target: schema.payoutAccount.userId,
        set: { ...input, updatedAt: now },
      })
      .returning();
    if (!row) throw new HTTPException(500, { message: "Could not save the payout details" });
    return row;
  });
}

/**
 * Opens a request for what the withdrawable balance is worth in whole cents, and
 * takes those points out of the account at once. The points leave now rather
 * than at payment: a balance left in place would answer a second request, and it
 * would expire while an admin reviewed it.
 *
 * Whatever has not served the hold — and the part of a cent the money cannot
 * carry — stays where it is and rolls over.
 */
export async function requestPayout(userId: string, now: Date = new Date()) {
  return db.transaction(async (tx) => {
    await lockMember(tx, userId);

    const account = await findAccount(tx, userId);
    const available = await getWithdrawable(tx, userId, now);
    const open = await countOpenRequests(tx, userId);
    const block = payoutBlock({
      withdrawable: available,
      hasAccount: account !== null,
      hasOpenRequest: open > 0,
    });
    if (block) throw new HTTPException(409, { message: BLOCK_MESSAGE[block] });

    const { points, usdCents } = payoutAmount(available);
    const id = crypto.randomUUID();
    // The debit is posted before the row that names it, so a request can never
    // exist without the entry that took its points.
    const entry = await postEntry(tx, {
      userId,
      delta: -points,
      reason: "payout",
      lot: "earned",
      state: "settled",
      idempotencyKey: `payout:${id}`,
      now,
    });
    // The key carries a fresh id, so nothing can already hold it. If that ever
    // stops being true, the request must not open without the debit behind it:
    // a refusal reverses the entry this row names.
    if (!entry.id) throw new HTTPException(500, { message: "Could not take the CapyPoints" });

    const [row] = await tx
      .insert(schema.payoutRequest)
      .values({
        id,
        userId,
        points,
        usdCents,
        state: "requested",
        ledgerEntryId: entry.id,
        createdAt: now,
      })
      .returning();
    if (!row) throw new HTTPException(500, { message: "Could not open the payout" });
    return row;
  });
}

/**
 * Every device on the network, counted by the two things that say "these are the
 * same room". It is a narrow projection rather than a grouped query, so
 * `normaliseLocation` stays the one place that decides when two addresses match.
 */
async function sharedCounts() {
  const rows = await db
    .select({ location: schema.device.location, lastNetwork: schema.device.lastNetwork })
    .from(schema.device)
    .where(sql`${schema.device.state} <> 'archived'`);
  return {
    networkCounts: countBy(rows.map((row) => row.lastNetwork)),
    locationCounts: countBy(rows.map((row) => normaliseLocation(row.location))),
  };
}

/** One device as the review reads it, before the flags are worked out. */
export interface DeviceHistory extends DeviceStat {
  userId: string;
  name: string;
  tier: (typeof schema.DEVICE_TIERS)[number];
  state: (typeof schema.DEVICE_STATES)[number];
}

/**
 * Counted plays and scans per device over the review window, by hour of day, for
 * every member in the batch at once. Three queries however long the queue is.
 *
 * The hour is the venue's own, not UTC: a window that says "shut at six" means
 * six where the screen stands. A device with no zone on file falls back to UTC.
 */
async function deviceHistory(userIds: string[], since: Date): Promise<DeviceHistory[]> {
  if (userIds.length === 0) return [];
  const mine = inArray(schema.device.userId, userIds);

  const devices = await db
    .select({
      id: schema.device.id,
      userId: schema.device.userId,
      name: schema.device.name,
      location: schema.device.location,
      tier: schema.device.tier,
      state: schema.device.state,
      openHour: schema.device.openHour,
      closeHour: schema.device.closeHour,
      lastSeenAt: schema.device.lastSeenAt,
      lastNetwork: schema.device.lastNetwork,
    })
    .from(schema.device)
    .where(mine);

  const localHour = sql<number>`extract(hour from ${schema.play.countedAt}
    at time zone coalesce(${schema.device.timezone}, 'UTC'))::int`;
  const playRows = await db
    .select({ deviceId: schema.device.id, hour: localHour, n: count() })
    .from(schema.play)
    .innerJoin(schema.placement, eq(schema.placement.id, schema.play.placementId))
    .innerJoin(schema.device, eq(schema.device.id, schema.placement.deviceId))
    .where(and(mine, eq(schema.play.state, "counted"), gte(schema.play.countedAt, since)))
    .groupBy(schema.device.id, localHour);

  const scanRows = await db
    .select({ deviceId: schema.device.id, n: count() })
    .from(schema.play)
    .innerJoin(schema.placement, eq(schema.placement.id, schema.play.placementId))
    .innerJoin(schema.device, eq(schema.device.id, schema.placement.deviceId))
    .where(and(mine, eq(schema.play.scanned, true), gte(schema.play.scannedAt, since)))
    .groupBy(schema.device.id);

  const scansByDevice = new Map(scanRows.map((row) => [row.deviceId, row.n]));
  const hoursByDevice = new Map<string, number[]>();
  for (const row of playRows) {
    const hours = hoursByDevice.get(row.deviceId) ?? Array.from({ length: 24 }, () => 0);
    hours[row.hour] = (hours[row.hour] ?? 0) + row.n;
    hoursByDevice.set(row.deviceId, hours);
  }

  return devices.map((device) => {
    const playsByHour = hoursByDevice.get(device.id) ?? Array.from({ length: 24 }, () => 0);
    return {
      deviceId: device.id,
      userId: device.userId,
      name: device.name,
      location: device.location,
      tier: device.tier,
      state: device.state,
      openHour: device.openHour,
      closeHour: device.closeHour,
      plays: playsByHour.reduce((sum, n) => sum + n, 0),
      scans: scansByDevice.get(device.id) ?? 0,
      playsByHour,
      lastSeenAt: device.lastSeenAt,
      lastNetwork: device.lastNetwork,
    };
  });
}

export interface ReviewedDevice extends DeviceHistory {
  flags: DeviceFlags;
}

/**
 * Every open request, with the history an admin reads before paying: the
 * scan-to-play ratio per device, the hours of the day each screen played in,
 * the plays that fell outside the venue's stated hours, and whether several
 * devices report from one address or one network.
 */
export async function listPayoutQueue(now: Date = new Date()) {
  const rows = await db
    .select({
      request: schema.payoutRequest,
      owner: { id: schema.user.id, name: schema.user.name, email: schema.user.email },
      account: schema.payoutAccount,
    })
    .from(schema.payoutRequest)
    .innerJoin(schema.user, eq(schema.user.id, schema.payoutRequest.userId))
    .leftJoin(schema.payoutAccount, eq(schema.payoutAccount.userId, schema.payoutRequest.userId))
    .where(eq(schema.payoutRequest.state, "requested"))
    .orderBy(schema.payoutRequest.createdAt);

  const windowDays = economy.payout.reviewWindowDays;
  if (rows.length === 0) return { windowDays, items: [] };

  const since = new Date(now.getTime() - windowDays * DAY_MS);
  const context = { ...(await sharedCounts()), now };
  const history = await deviceHistory([...new Set(rows.map((row) => row.owner.id))], since);

  const byOwner = new Map<string, ReviewedDevice[]>();
  for (const device of history) {
    const owned = byOwner.get(device.userId) ?? [];
    owned.push({ ...device, flags: flagDevice(device, context) });
    byOwner.set(device.userId, owned);
  }

  return {
    windowDays,
    items: rows.map((row) => ({
      request: row.request,
      owner: { name: row.owner.name, email: row.owner.email },
      account: row.account,
      devices: byOwner.get(row.owner.id) ?? [],
    })),
  };
}

async function takeOpenRequest(tx: Tx, id: string) {
  const [row] = await tx
    .select()
    .from(schema.payoutRequest)
    .where(eq(schema.payoutRequest.id, id))
    .limit(1)
    .for("update");
  if (!row) throw new HTTPException(404, { message: "Payout not found" });
  if (row.state !== "requested") {
    throw new HTTPException(409, { message: "This payout was already reviewed" });
  }
  return row;
}

/** Records one admin's decision on an open request. Both decisions close it. */
async function decide(
  id: string,
  adminId: string,
  now: Date,
  decision: { state: "paid"; reference: string } | { state: "rejected"; rejectionReason: string },
) {
  return db.transaction(async (tx) => {
    const request = await takeOpenRequest(tx, id);

    // A refusal hands the points back. It reverses the debit with a compensating
    // row and never edits it: the ledger is append-only, and a member who was
    // refused must be able to read why their points came back.
    if (decision.state === "rejected" && request.ledgerEntryId) {
      await voidEntry(request.ledgerEntryId, now, tx);
    }

    const [row] = await tx
      .update(schema.payoutRequest)
      .set({ ...decision, reviewedBy: adminId, reviewedAt: now })
      .where(eq(schema.payoutRequest.id, id))
      .returning();
    if (!row) throw new HTTPException(404, { message: "Payout not found" });
    return row;
  });
}

/**
 * The money left. The points already did, at the request, so nothing moves on
 * the ledger here: this records that the transfer went out and how to trace it.
 */
export async function payPayout(
  id: string,
  adminId: string,
  reference: string,
  now: Date = new Date(),
) {
  return decide(id, adminId, now, { state: "paid", reference });
}

/** The admin refused the request, so the points go back. */
export async function rejectPayout(
  id: string,
  adminId: string,
  reason: string,
  now: Date = new Date(),
) {
  return decide(id, adminId, now, { state: "rejected", rejectionReason: reason });
}
