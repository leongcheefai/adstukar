import { slotPrice } from "@repo/config/economy";
import type { BookSlotInput } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { type SQL, desc, eq, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { insertCampaign, listingsFor } from "../campaigns/campaigns.service";
import { lockMember, postSpend } from "../ledger/ledger.service";
import { insertListing } from "../listings/listings.service";
import { availability, loopOf } from "./slots";

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
  try {
    return await db.transaction(async (tx) => {
      await lockMember(tx, userId);

      const campaign = await insertCampaign(tx, userId, { name: input.name, url: input.url }, now);
      const listing = await insertListing(
        tx,
        campaign.id,
        { tagline: input.tagline, logoUrl: input.logoUrl ?? null },
        now,
      );

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

      const [slot] = await tx
        .insert(schema.slot)
        .values({
          id,
          userId,
          campaignId: campaign.id,
          position: input.position,
          state: "booked",
          amount: price,
          bookedAt: now,
          createdAt: now,
        })
        .returning();
      if (!slot) throw new HTTPException(500, { message: "Insert failed" });

      return { slot, campaign, listing };
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw new HTTPException(409, { message: "Somebody took that position a moment ago" });
    }
    throw err;
  }
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
async function slotsWithCreative(where: SQL): Promise<SlotWithCampaignRow[]> {
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
