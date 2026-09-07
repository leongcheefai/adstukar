import { economy } from "@repo/config/economy";
import type { CreateListingInput, UpdateListingInput } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { and, asc, count, eq, ne } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { getOwnedCampaign } from "../campaigns/campaigns.service";

const LIVE_LISTING = ne(schema.listing.state, "archived");

export async function listListings(userId: string, campaignId?: string) {
  const conditions = [eq(schema.campaign.userId, userId), LIVE_LISTING];
  if (campaignId) conditions.push(eq(schema.listing.campaignId, campaignId));
  const rows = await db
    .select({ listing: schema.listing })
    .from(schema.listing)
    .innerJoin(schema.campaign, eq(schema.campaign.id, schema.listing.campaignId))
    .where(and(...conditions))
    .orderBy(asc(schema.listing.createdAt));
  return rows.map((r) => r.listing);
}

export async function getOwnedListing(userId: string, listingId: string) {
  const [row] = await db
    .select({ listing: schema.listing })
    .from(schema.listing)
    .innerJoin(schema.campaign, eq(schema.campaign.id, schema.listing.campaignId))
    .where(and(eq(schema.listing.id, listingId), eq(schema.campaign.userId, userId)))
    .limit(1);
  if (!row) throw new HTTPException(404, { message: "Listing not found" });
  return row.listing;
}

export async function createListing(userId: string, input: CreateListingInput) {
  const campaign = await getOwnedCampaign(userId, input.campaignId);
  if (campaign.state === "archived") {
    throw new HTTPException(409, { message: "Campaign is archived" });
  }

  // The cap is what makes a campaign a comparison of a few creatives rather than
  // an unbounded pile.
  const [held] = await db
    .select({ n: count() })
    .from(schema.listing)
    .where(and(eq(schema.listing.campaignId, campaign.id), LIVE_LISTING));
  if ((held?.n ?? 0) >= economy.maxListingsPerCampaign) {
    throw new HTTPException(409, {
      message: `A campaign holds up to ${economy.maxListingsPerCampaign} listings`,
    });
  }

  const now = new Date();
  const [row] = await db
    .insert(schema.listing)
    .values({
      id: crypto.randomUUID(),
      campaignId: campaign.id,
      tagline: input.tagline,
      logoUrl: input.logoUrl ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new HTTPException(500, { message: "Insert failed" });
  return row;
}

export async function updateListing(userId: string, listingId: string, input: UpdateListingInput) {
  const existing = await getOwnedListing(userId, listingId);
  if (existing.state === "archived") {
    throw new HTTPException(409, { message: "Listing is archived" });
  }

  const patch: Partial<typeof schema.listing.$inferInsert> = { updatedAt: new Date() };
  if (input.tagline !== undefined) patch.tagline = input.tagline;
  if (input.logoUrl !== undefined) patch.logoUrl = input.logoUrl;

  // An edited creative is a new creative, so it goes back to the queue.
  if (input.tagline !== undefined || input.logoUrl !== undefined) {
    patch.state = "pending";
    patch.rejectionReason = null;
  }

  const [row] = await db
    .update(schema.listing)
    .set(patch)
    .where(eq(schema.listing.id, listingId))
    .returning();
  if (!row) throw new HTTPException(404, { message: "Listing not found" });
  return row;
}

/** A delete is an archive: plays reference the listing, and the ledger references the plays. */
export async function archiveListing(userId: string, listingId: string) {
  await getOwnedListing(userId, listingId);
  await db
    .update(schema.listing)
    .set({ state: "archived", updatedAt: new Date() })
    .where(eq(schema.listing.id, listingId));
  return { id: listingId };
}
