import { slotTermEnd } from "@repo/config/economy";
import { db, schema } from "@repo/db";
import { and, eq, inArray, lte } from "drizzle-orm";
import { type Tx, voidEntry } from "../ledger/ledger.service";
import { canRefund } from "./slots";

/**
 * The life of a term. The booking service opens a slot; this file moves it
 * on. Every function takes the transaction of the act that moved it, so the
 * approval that starts a term and the term commit together.
 */

/** The keys the charge posted under. `postSpend` appends the lot. */
export function chargeKeys(slotId: string): string[] {
  return [`slot:${slotId}:granted`, `slot:${slotId}:bought`];
}

const liveUnder = (campaignId: string) =>
  and(eq(schema.slot.campaignId, campaignId), inArray(schema.slot.state, ["booked", "running"]));

/** The live slot under a campaign, locked for the act that moves it. */
async function liveSlotOf(tx: Tx, campaignId: string) {
  const [row] = await tx
    .select()
    .from(schema.slot)
    .where(liveUnder(campaignId))
    .limit(1)
    .for("update");
  return row ?? null;
}

/**
 * Whether the campaign holds a slot that is booked or running. A live slot
 * does not pause: the member paid for the position for a term, and the term
 * runs to its end. The exits are an edit, which sends the creative back to
 * review, and an archive (docs/adr/0009).
 */
export async function hasLiveSlot(tx: Tx, campaignId: string): Promise<boolean> {
  const [row] = await tx
    .select({ id: schema.slot.id })
    .from(schema.slot)
    .where(liveUnder(campaignId))
    .limit(1);
  return row !== undefined;
}

/**
 * Starts the term when both gates are open: the domain is verified and one
 * creative is approved. Called after each gate opens; a slot already running
 * is left alone, so the second call is a no-op.
 */
export async function startSlot(tx: Tx, campaignId: string, now: Date): Promise<boolean> {
  const slot = await liveSlotOf(tx, campaignId);
  if (!slot || slot.state !== "booked") return false;

  const [campaign] = await tx
    .select({ verifiedAt: schema.campaign.verifiedAt })
    .from(schema.campaign)
    .where(eq(schema.campaign.id, campaignId))
    .limit(1);
  if (!campaign?.verifiedAt) return false;

  const [approved] = await tx
    .select({ id: schema.listing.id })
    .from(schema.listing)
    .where(and(eq(schema.listing.campaignId, campaignId), eq(schema.listing.state, "approved")))
    .limit(1);
  if (!approved) return false;

  await tx
    .update(schema.slot)
    .set({ state: "running", startsAt: now, endsAt: slotTermEnd(now) })
    .where(eq(schema.slot.id, slot.id));
  return true;
}

/**
 * Gives the charge back on a booking whose term never started, and closes
 * the booking. A running slot is left alone: it has shown, so it keeps its
 * charge and its term. Returns true when a slot changed.
 */
export async function refundSlot(tx: Tx, campaignId: string, now: Date): Promise<boolean> {
  const slot = await liveSlotOf(tx, campaignId);
  if (!slot || !canRefund(slot.state)) return false;

  const entries = await tx
    .select({ id: schema.ledgerEntry.id })
    .from(schema.ledgerEntry)
    .where(inArray(schema.ledgerEntry.idempotencyKey, chargeKeys(slot.id)));
  for (const entry of entries) await voidEntry(entry.id, now, tx);

  await tx
    .update(schema.slot)
    .set({ state: "refunded", endedAt: now })
    .where(eq(schema.slot.id, slot.id));
  return true;
}

/**
 * The archive path: the campaign is gone, so no slot may stay live under it.
 * A booking that never ran is refunded; a running one ends and keeps its
 * charge. Returns true when a slot changed.
 */
export async function closeSlot(tx: Tx, campaignId: string, now: Date): Promise<boolean> {
  if (await refundSlot(tx, campaignId, now)) return true;
  const slot = await liveSlotOf(tx, campaignId);
  if (!slot) return false;
  await tx
    .update(schema.slot)
    .set({ state: "ended", endedAt: now })
    .where(eq(schema.slot.id, slot.id));
  return true;
}

/** Ends every running slot whose term is over. Returns the number of rows touched. */
export async function endDueSlots(now: Date): Promise<number> {
  const rows = await db
    .update(schema.slot)
    .set({ state: "ended", endedAt: now })
    .where(and(eq(schema.slot.state, "running"), lte(schema.slot.endsAt, now)))
    .returning({ id: schema.slot.id });
  return rows.length;
}
