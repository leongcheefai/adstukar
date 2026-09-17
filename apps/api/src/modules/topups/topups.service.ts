import { economy } from "@repo/config/economy";
import { project } from "@repo/config/project";
import type { CreateTopupInput } from "@repo/contracts";
import { db, schema } from "@repo/db";
import type { TopupRefundBlock } from "@repo/db/enums";
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { stripe } from "../../lib/stripe";
import { type Tx, getLotBalances, lockMember, postEntry } from "../ledger/ledger.service";
import { findPack, refundAmount, refundBlock, unspentByTopup } from "./packs";

/**
 * The database side of a top-up. An advertiser picks a pack, pays Stripe, and
 * the webhook posts the points against the `bought` lot. A refund inside the
 * window takes the unspent part back at the peg, less what the processor kept.
 *
 * The rules themselves are pure and live in `packs.ts`.
 */

/** What a member is told when a refund cannot go ahead. */
const BLOCK_MESSAGE: Record<TopupRefundBlock, string> = {
  "not-paid": "This top-up has no money to give back.",
  "window-closed": `A refund runs for ${economy.topup.refundWindowDays} days after the payment.`,
  "nothing-left": `Those ${project.pointsName} are spent. Only unspent ${project.pointsName} refund.`,
  "below-fee": "The card fee is more than this refund is worth.",
};

/**
 * Opens a checkout for one pack.
 *
 * The row goes in before the Stripe call, so a session can never exist without
 * the row the webhook looks for. The Stripe call then runs inside the same
 * transaction: if it throws, the row rolls back with it and no dead pending
 * top-up is left behind.
 *
 * The price comes from the pack, never from the request. A browser names an
 * amount of points and nothing else.
 */
export async function createTopupCheckout(userId: string, input: CreateTopupInput) {
  const pack = findPack(input.points);
  if (!pack) {
    throw new HTTPException(400, {
      message: `That is not a ${project.pointsName} pack we sell`,
    });
  }

  return db.transaction(async (tx) => {
    const id = crypto.randomUUID();
    await tx.insert(schema.topup).values({
      id,
      userId,
      points: pack.points,
      usdCents: pack.usdCents,
      state: "pending",
    });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: pack.usdCents,
            product_data: {
              name: `${pack.points.toLocaleString()} ${project.pointsName}`,
              description: `${project.name} advertising credit`,
            },
          },
        },
      ],
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
      // The row id travels with the payment, so the webhook finds the row it
      // opened rather than trusting an amount the browser could have named.
      client_reference_id: id,
      metadata: { topupId: id, userId },
      payment_intent_data: { metadata: { topupId: id, userId } },
    });

    await tx
      .update(schema.topup)
      .set({ stripeSessionId: session.id })
      .where(eq(schema.topup.id, id));

    return { url: session.url };
  });
}

/**
 * Puts the points in, once the money is in. Called from the Stripe webhook.
 *
 * The ledger entry is keyed on the payment, so a webhook Stripe sends twice
 * posts the points once. The row moves to `paid` in the same transaction, so
 * the points and the record of the sale can never disagree.
 */
export async function recordPaidTopup(
  input: { topupId: string; paymentIntentId: string; sessionId: string },
  now: Date = new Date(),
) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select()
      .from(schema.topup)
      .where(eq(schema.topup.id, input.topupId))
      .limit(1)
      .for("update");
    if (!row) return null;
    // A session that expired and then paid is rare but possible, and the money
    // decides. Only a top-up whose points already went in is left alone.
    if (row.state === "paid" || row.state === "refunded") return row;

    await lockMember(tx, row.userId);
    const key = `topup:${input.paymentIntentId}`;
    const entry = await postEntry(tx, {
      userId: row.userId,
      delta: row.points,
      reason: "topup",
      lot: "bought",
      state: "settled",
      idempotencyKey: key,
      now,
    });

    // A repeat of the same payment posts nothing and returns no id. The entry is
    // still the one that holds these points, and the refund reverses it by name,
    // so read it back rather than leaving the row without its entry.
    const ledgerEntryId = entry.id ?? (await findEntryIdByKey(tx, key));

    const [updated] = await tx
      .update(schema.topup)
      .set({
        state: "paid",
        paidAt: now,
        stripeSessionId: input.sessionId,
        stripePaymentIntentId: input.paymentIntentId,
        ledgerEntryId,
      })
      .where(eq(schema.topup.id, row.id))
      .returning();
    return updated ?? null;
  });
}

/** The entry one idempotency key already posted, when a repeat found it taken. */
async function findEntryIdByKey(tx: Tx, key: string): Promise<string | null> {
  const [row] = await tx
    .select({ id: schema.ledgerEntry.id })
    .from(schema.ledgerEntry)
    .where(eq(schema.ledgerEntry.idempotencyKey, key))
    .limit(1);
  return row?.id ?? null;
}

/** A checkout nobody finished. It never took money, so it only closes the row. */
export async function abandonTopup(topupId: string) {
  await db
    .update(schema.topup)
    .set({ state: "abandoned" })
    .where(and(eq(schema.topup.id, topupId), eq(schema.topup.state, "pending")));
}

/** One top-up, with what it may still give back today. */
export interface TopupHistoryItem {
  topup: typeof schema.topup.$inferSelect;
  refundablePoints: number;
  refundNetCents: number;
  block: TopupRefundBlock | null;
}

/**
 * The unspent points of every top-up this member ever paid for, keyed by id.
 *
 * It reads every paid top-up, never a page of them: the allocation walks the
 * whole history from the oldest purchase, and a truncated list would hand the
 * balance to the wrong rows. `paidAt` is the test, because a row that never took
 * money put no points in.
 */
async function unspentByTopupId(tx: Tx, userId: string): Promise<Map<string, number>> {
  const [rows, balances] = await Promise.all([
    tx
      .select({
        id: schema.topup.id,
        points: schema.topup.points,
        refundedPoints: schema.topup.refundedPoints,
      })
      .from(schema.topup)
      .where(and(eq(schema.topup.userId, userId), isNotNull(schema.topup.paidAt)))
      .orderBy(schema.topup.paidAt),
    getLotBalances(tx, userId),
  ]);

  const unspent = unspentByTopup(
    rows.map((row) => ({ points: row.points, refunded: row.refundedPoints ?? 0 })),
    balances.bought,
  );
  return new Map(rows.map((row, i) => [row.id, unspent[i] ?? 0]));
}

/** One top-up read against that allocation: what it may refund, and why it may not. */
function toHistoryItem(
  row: typeof schema.topup.$inferSelect,
  unspent: number,
  now: Date,
): TopupHistoryItem {
  const money = refundAmount(unspent, row);
  return {
    topup: row,
    refundablePoints: money.points,
    refundNetCents: money.netCents,
    block: refundBlock({
      state: row.state,
      paidAt: row.paidAt,
      refundablePoints: money.points,
      netCents: money.netCents,
      now,
    }),
  };
}

/** Everything the buy panel needs: what we sell, and what was already bought. */
export async function getTopupOverview(userId: string, now: Date = new Date()) {
  const [rows, unspent] = await Promise.all([
    db
      .select()
      .from(schema.topup)
      .where(eq(schema.topup.userId, userId))
      .orderBy(desc(schema.topup.createdAt))
      .limit(50),
    unspentByTopupId(db, userId),
  ]);

  return {
    packs: economy.topup.packs.map((pack) => ({ ...pack })),
    refundWindowDays: economy.topup.refundWindowDays,
    items: rows.map((row) => toHistoryItem(row, unspent.get(row.id) ?? 0, now)),
  };
}

/**
 * Every top-up that took money, newest first, with what each may still give
 * back. This is the admin's refund desk: a member never refunds their own
 * purchase, so the owner rides along to say whose money it is.
 */
export async function listTopupQueue(now: Date = new Date()) {
  const rows = await db
    .select({
      topup: schema.topup,
      owner: { id: schema.user.id, name: schema.user.name, email: schema.user.email },
    })
    .from(schema.topup)
    .innerJoin(schema.user, eq(schema.user.id, schema.topup.userId))
    .where(inArray(schema.topup.state, ["paid", "refunded"]))
    .orderBy(desc(schema.topup.createdAt))
    .limit(100);

  // The unspent part is allocated per member across their whole history, so it
  // is read once per owner rather than once per row.
  const owners = [...new Set(rows.map((row) => row.owner.id))];
  const unspent = new Map<string, number>();
  for (const perOwner of await Promise.all(owners.map((id) => unspentByTopupId(db, id)))) {
    for (const [id, points] of perOwner) unspent.set(id, points);
  }

  return {
    refundWindowDays: economy.topup.refundWindowDays,
    items: rows.map((row) => ({
      ...toHistoryItem(row.topup, unspent.get(row.topup.id) ?? 0, now),
      owner: { name: row.owner.name, email: row.owner.email },
    })),
  };
}

/**
 * Gives the unspent part of one top-up back as money. An admin's act: the member
 * asks, and the route that calls this sits behind the admin guard.
 *
 * It runs in two steps, and the order is the whole point. The transaction takes
 * the points and records the refund, and only then does the money go out. The
 * reverse order — paying inside the transaction — loses the money outright if
 * the commit then fails: the debit rolls back, and the member keeps both the
 * points and the cash.
 *
 * So a refund can rest, briefly, in a state where the points are gone and the
 * money has not left. That state is visible (`refunded` with no
 * `stripeRefundId`) and it is retried by asking again: Stripe carries the
 * top-up id as its idempotency key, so a second try either finishes the first
 * payment or returns it.
 *
 * A refund never edits the `topup` entry. It posts the compensating row beside
 * it, because the ledger is append-only and a member must be able to read where
 * the money went.
 */
export async function refundTopup(topupId: string, now: Date = new Date()) {
  return sendRefund(await openRefund(topupId, now));
}

/**
 * Takes the points and records the refund, under the member's lock. No network
 * call happens here: the lock is the one every movement on this purse queues
 * behind, and holding it across a call to Stripe would stall a screen's report.
 */
async function openRefund(topupId: string, now: Date) {
  return db.transaction(async (tx) => {
    // The lock is per member, and the row names the member. Read the owner
    // first, take the lock, and only then take the row itself.
    const [found] = await tx
      .select({ userId: schema.topup.userId })
      .from(schema.topup)
      .where(eq(schema.topup.id, topupId))
      .limit(1);
    if (!found) throw new HTTPException(404, { message: "Top-up not found" });
    const userId = found.userId;
    await lockMember(tx, userId);

    const [row] = await tx
      .select()
      .from(schema.topup)
      .where(eq(schema.topup.id, topupId))
      .limit(1)
      .for("update");
    if (!row) throw new HTTPException(404, { message: "Top-up not found" });

    // The points already left on an earlier try and only the money is owed.
    // Nothing more to take, so go straight on to sending it.
    if (row.state === "refunded" && !row.stripeRefundId) return row;

    const unspent = await unspentByTopupId(tx, userId);
    const { refundablePoints, refundNetCents, block } = toHistoryItem(
      row,
      unspent.get(row.id) ?? 0,
      now,
    );
    if (block) throw new HTTPException(409, { message: BLOCK_MESSAGE[block] });
    if (!row.stripePaymentIntentId) {
      throw new HTTPException(409, { message: "This top-up has no payment to refund" });
    }

    const entry = await postEntry(tx, {
      userId,
      delta: -refundablePoints,
      reason: "refund",
      lot: "bought",
      state: "settled",
      idempotencyKey: `refund:${row.id}`,
      relatedEntryId: row.ledgerEntryId,
      now,
    });
    // The key carries this row's id and the row was not refunded, so nothing can
    // already hold it. If that ever stops being true, the money must not go out
    // without the debit behind it.
    if (!entry.id) {
      throw new HTTPException(500, { message: `Could not take the ${project.pointsName} back` });
    }

    // The whole unspent part goes at once, so the row closes here. What the
    // rounding to a whole cent leaves behind is under a cent and stays put.
    const [updated] = await tx
      .update(schema.topup)
      .set({
        state: "refunded",
        refundedPoints: refundablePoints,
        refundUsdCents: refundNetCents,
        refundLedgerEntryId: entry.id,
        refundedAt: now,
      })
      .where(eq(schema.topup.id, row.id))
      .returning();
    if (!updated) throw new HTTPException(500, { message: "Could not record the refund" });
    return updated;
  });
}

/**
 * Sends the money for a refund the ledger has already taken the points for, and
 * stamps the reference. The Stripe idempotency key is the top-up id, so a retry
 * after a failure here returns the first payment rather than sending a second.
 */
async function sendRefund(row: typeof schema.topup.$inferSelect) {
  if (row.stripeRefundId) return row;
  if (!row.stripePaymentIntentId) {
    throw new HTTPException(409, { message: "This top-up has no payment to refund" });
  }

  const refund = await stripe.refunds.create(
    { payment_intent: row.stripePaymentIntentId, amount: row.refundUsdCents ?? 0 },
    { idempotencyKey: `refund:${row.id}` },
  );

  const [updated] = await db
    .update(schema.topup)
    .set({ stripeRefundId: refund.id })
    .where(eq(schema.topup.id, row.id))
    .returning();
  return updated ?? row;
}
