import { economy, slotPrice } from "@repo/config/economy";
import type { BookSlotInput, CompSlotInput } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { type SQL, and, count, desc, eq, inArray, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { insertCampaign, listingsFor } from "../campaigns/campaigns.service";
import { type Tx, lockMember, postSpend } from "../ledger/ledger.service";
import { insertListing } from "../listings/listings.service";
import { availability, compsLeft, loopOf } from "./slots";

type SlotRow = typeof schema.slot.$inferSelect;
type CampaignRow = typeof schema.campaign.$inferSelect;
type ListingRow = typeof schema.listing.$inferSelect;

export interface SlotWithCampaignRow {
  slot: SlotRow;
  campaign: CampaignRow;
  listing: ListingRow | null;
}

/** Postgres: unique_violation. */
const UNIQUE_VIOLATION = "23505";

/**
 * Drizzle wraps the driver's error and keeps it in `cause`, so the code sits
 * one level down. Both levels are read, in case a future driver throws bare.
 */
function isUniqueViolation(err: unknown): boolean {
  if (typeof err !== "object" || err === null) return false;
  if ("code" in err && err.code === UNIQUE_VIOLATION) return true;
  return "cause" in err && isUniqueViolation(err.cause);
}

/**
 * The campaign, its one creative, and the slot row, inside the caller's
 * transaction. The caller decides what the slot costs: a booking charges the
 * price first and passes it in; a comp passes nothing and names the admin.
 */
async function openSlot(
  tx: Tx,
  userId: string,
  input: BookSlotInput,
  id: string,
  terms: { amount: number; compedBy: string | null },
  now: Date,
): Promise<SlotWithCampaignRow> {
  const campaign = await insertCampaign(tx, userId, { name: input.name, url: input.url }, now);
  const listing = await insertListing(
    tx,
    campaign.id,
    { tagline: input.tagline, logoUrl: input.logoUrl ?? null },
    now,
  );

  const [slot] = await tx
    .insert(schema.slot)
    .values({
      id,
      userId,
      campaignId: campaign.id,
      position: input.position,
      state: "booked",
      amount: terms.amount,
      comped: terms.compedBy !== null,
      compedBy: terms.compedBy,
      bookedAt: now,
      createdAt: now,
    })
    .returning();
  if (!slot) throw new HTTPException(500, { message: "Insert failed" });

  return { slot, campaign, listing };
}

/** The database's refusal of a taken position, said the way a person reads it. */
async function positionGuard<T>(run: () => Promise<T>): Promise<T> {
  try {
    return await run();
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new HTTPException(409, { message: "Somebody took that position a moment ago" });
    }
    throw err;
  }
}

/**
 * One booking in one transaction: the campaign, its creative, the charge, and
 * the slot. The member's row is locked first, so two bookings from one account
 * read one balance in turn. A short balance rolls everything back, and so does
 * a position somebody took a moment earlier: the database, not this code,
 * refuses the second booking on one position.
 */
export async function bookSlot(
  userId: string,
  input: BookSlotInput,
  now: Date = new Date(),
): Promise<SlotWithCampaignRow> {
  return positionGuard(() =>
    db.transaction(async (tx) => {
      await lockMember(tx, userId);

      const id = crypto.randomUUID();
      const price = slotPrice();
      const { posted } = await postSpend(tx, {
        userId,
        amount: price,
        reason: "spend",
        idempotencyKey: `slot:${id}`,
        now,
      });
      if (posted < price) {
        throw new HTTPException(409, { message: "Your balance does not cover this slot" });
      }

      return openSlot(tx, userId, input, id, { amount: price, compedBy: null }, now);
    }),
  );
}

const liveComped = and(
  eq(schema.slot.comped, true),
  inArray(schema.slot.state, ["booked", "running"]),
);

/**
 * An admin gives a slot to a member for nothing (docs/adr/0014). It opens
 * exactly as a booking does, minus the charge: no ledger row, `amount` 0. The
 * domain check and the review still gate the term, and the term, the ring and
 * the pay to the screens are the ones every slot gets.
 *
 * The cap on live comps is read and written under one lock, so two admins who
 * press at once cannot both take the last place.
 */
export async function compSlot(
  adminId: string,
  input: CompSlotInput,
  now: Date = new Date(),
): Promise<SlotWithCampaignRow & { owner: { name: string; email: string } }> {
  const [member] = await db
    .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email })
    .from(schema.user)
    .where(eq(schema.user.email, input.email))
    .limit(1);
  if (!member) throw new HTTPException(404, { message: "No member signed up with that email" });

  const opened = await positionGuard(() =>
    db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext('slot:comp'))`);
      const [live] = await tx.select({ n: count() }).from(schema.slot).where(liveComped);
      if (compsLeft(live?.n ?? 0) === 0) {
        throw new HTTPException(409, {
          message: "Every complimentary slot is in use. One frees when its term ends",
        });
      }
      return openSlot(
        tx,
        member.id,
        input,
        crypto.randomUUID(),
        { amount: 0, compedBy: adminId },
        now,
      );
    }),
  );
  return { ...opened, owner: { name: member.name, email: member.email } };
}

/** The one creative a slot shows: the approved one, else the newest live one. */
function creativeOf(listings: ListingRow[]): ListingRow | null {
  const live = listings.filter((l) => l.state !== "archived");
  return live.find((l) => l.state === "approved") ?? live[live.length - 1] ?? null;
}

/**
 * Slots with their campaign and the one creative each shows. Both lists the
 * API serves read this: the member's own bookings, and the ring every screen
 * prints.
 */
async function slotsWithCreative(where: SQL | undefined): Promise<SlotWithCampaignRow[]> {
  const rows = await db
    .select({ slot: schema.slot, campaign: schema.campaign })
    .from(schema.slot)
    .innerJoin(schema.campaign, eq(schema.campaign.id, schema.slot.campaignId))
    .where(where)
    .orderBy(desc(schema.slot.createdAt));
  const listings = await listingsFor(rows.map((r) => r.campaign.id));
  return rows.map(({ slot, campaign }) => ({
    slot,
    campaign,
    listing: creativeOf(listings.get(campaign.id) ?? []),
  }));
}

/** This member's bookings, newest first, each with its campaign and creative. */
export async function listOwnSlots(userId: string): Promise<{ items: SlotWithCampaignRow[] }> {
  return { items: await slotsWithCreative(eq(schema.slot.userId, userId)) };
}

/** The ring every screen prints, and how full it is. */
export async function loop() {
  const live = await slotsWithCreative(inArray(schema.slot.state, ["booked", "running"]));
  const slots = live.map(({ slot, campaign, listing }) => ({
    position: slot.position,
    state: slot.state,
    active: campaign.state === "active",
    listingState: listing?.state ?? null,
    name: campaign.name,
    tagline: listing?.tagline ?? null,
    logoUrl: listing?.logoUrl ?? null,
    url: campaign.url,
  }));
  return { bands: loopOf(slots), availability: availability(slots) };
}

/** The live comped slots, each with the member it went to, and how many more the cap allows. */
export async function listCompedSlots() {
  const items = await slotsWithCreative(liveComped);
  const owners = items.length
    ? await db
        .select({ id: schema.user.id, name: schema.user.name, email: schema.user.email })
        .from(schema.user)
        .where(inArray(schema.user.id, [...new Set(items.map((i) => i.slot.userId))]))
    : [];
  const byId = new Map(owners.map((o) => [o.id, { name: o.name, email: o.email }]));
  return {
    // The owner is always there: a slot cascades away with its member.
    items: items.flatMap((item) => {
      const owner = byId.get(item.slot.userId);
      return owner ? [{ ...item, owner }] : [];
    }),
    max: economy.slot.compMax,
    left: compsLeft(items.length),
  };
}
