import type { BookSlotInput } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { insertCampaign } from "../campaigns/campaigns.service";
import { lockMember, postSpend } from "../ledger/ledger.service";
import { insertListing } from "../listings/listings.service";
import { SLOT_PRICE, availability, loopOf } from "./slots";

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
      const { posted } = await postSpend(tx, {
        userId,
        amount: SLOT_PRICE,
        reason: "spend",
        idempotencyKey: `slot:${id}`,
        now,
      });
      if (posted < SLOT_PRICE) {
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
          amount: SLOT_PRICE,
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

async function listingsFor(campaignIds: string[]): Promise<Map<string, ListingRow[]>> {
  const map = new Map<string, ListingRow[]>();
  if (campaignIds.length === 0) return map;
  const rows = await db
    .select()
    .from(schema.listing)
    .where(
      and(inArray(schema.listing.campaignId, campaignIds), ne(schema.listing.state, "archived")),
    )
    .orderBy(asc(schema.listing.createdAt));
  for (const row of rows) {
    const group = map.get(row.campaignId) ?? [];
    group.push(row);
    map.set(row.campaignId, group);
  }
  return map;
}

/** This member's bookings, newest first, each with its campaign and creative. */
export async function listOwnSlots(userId: string): Promise<{ items: SlotWithCampaignRow[] }> {
  const rows = await db
    .select({ slot: schema.slot, campaign: schema.campaign })
    .from(schema.slot)
    .innerJoin(schema.campaign, eq(schema.campaign.id, schema.slot.campaignId))
    .where(eq(schema.slot.userId, userId))
    .orderBy(desc(schema.slot.createdAt));
  const listings = await listingsFor(rows.map((r) => r.campaign.id));
  return {
    items: rows.map(({ slot, campaign }) => ({
      slot,
      campaign,
      listing: creativeOf(listings.get(campaign.id) ?? []),
    })),
  };
}

/** The loop every screen prints, and how full it is. */
export async function loop() {
  const rows = await db
    .select({ slot: schema.slot, campaign: schema.campaign })
    .from(schema.slot)
    .innerJoin(schema.campaign, eq(schema.campaign.id, schema.slot.campaignId))
    .where(inArray(schema.slot.state, ["booked", "running"]));
  const listings = await listingsFor(rows.map((r) => r.campaign.id));
  const slots = rows.map(({ slot, campaign }) => {
    const listing = creativeOf(listings.get(campaign.id) ?? []);
    return {
      position: slot.position,
      state: slot.state,
      listingState: listing?.state ?? null,
      name: campaign.name,
      tagline: listing?.tagline ?? null,
      logoUrl: listing?.logoUrl ?? null,
      url: campaign.url,
    };
  });
  return { bands: loopOf(slots), availability: availability(slots) };
}
