import { randomBytes } from "node:crypto";
import type { CreateCampaignInput, UpdateCampaignInput } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { and, asc, desc, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { domainFromUrl } from "../../lib/domain";
import type { Tx } from "../ledger/ledger.service";
import { closeSlot, hasLiveSlot, startSlot } from "../slots/term";
import { verifyDomain } from "./verification";

type CampaignRow = typeof schema.campaign.$inferSelect;
type ListingRow = typeof schema.listing.$inferSelect;

/** The answer to a pause on a campaign that holds a live slot. The listing service says the same. */
export const SLOT_DOES_NOT_PAUSE =
  "A slot does not pause. Edit the ad to send it back to review, or archive the slot.";

/** Archived rows stay for the ledger to reference, and leave every list. */
const LIVE_CAMPAIGN = ne(schema.campaign.state, "archived");
const LIVE_LISTING = ne(schema.listing.state, "archived");

/** The live listings under each campaign, oldest first. The slot service reads it too. */
export async function listingsFor(campaignIds: string[]): Promise<Map<string, ListingRow[]>> {
  const map = new Map<string, ListingRow[]>();
  if (campaignIds.length === 0) return map;
  const rows = await db
    .select()
    .from(schema.listing)
    .where(and(inArray(schema.listing.campaignId, campaignIds), LIVE_LISTING))
    .orderBy(asc(schema.listing.createdAt));
  for (const row of rows) {
    const group = map.get(row.campaignId) ?? [];
    group.push(row);
    map.set(row.campaignId, group);
  }
  return map;
}

/** A campaign travels with its listings, because a listing is what a slot shows. */
function withListings(rows: CampaignRow[], listings: Map<string, ListingRow[]>) {
  return rows.map((campaign) => ({
    campaign,
    listings: listings.get(campaign.id) ?? [],
  }));
}

export async function listCampaigns(userId: string) {
  const rows = await db
    .select()
    .from(schema.campaign)
    .where(and(eq(schema.campaign.userId, userId), LIVE_CAMPAIGN))
    .orderBy(desc(schema.campaign.createdAt));
  const listings = await listingsFor(rows.map((c) => c.id));
  return withListings(rows, listings);
}

export async function getOwnedCampaign(userId: string, campaignId: string) {
  const [row] = await db
    .select()
    .from(schema.campaign)
    .where(and(eq(schema.campaign.id, campaignId), eq(schema.campaign.userId, userId)))
    .limit(1);
  if (!row) throw new HTTPException(404, { message: "Campaign not found" });
  return row;
}

async function single(campaign: CampaignRow) {
  const listings = await listingsFor([campaign.id]);
  const [item] = withListings([campaign], listings);
  if (!item) throw new HTTPException(500, { message: "Campaign vanished" });
  return item;
}

function requireDomain(url: string): string {
  const domain = domainFromUrl(url);
  if (!domain) throw new HTTPException(400, { message: "URL must be a public http(s) address" });
  return domain;
}

/**
 * The moment this member proved they own the domain, on any campaign they still
 * hold. Proof belongs to the person and the domain, so a second campaign on a
 * domain they already verified starts running at once. It is never read across
 * members: one member's proof says nothing about another.
 */
async function domainVerifiedAt(tx: Tx, userId: string, domain: string): Promise<Date | null> {
  const [row] = await tx
    .select({ verifiedAt: schema.campaign.verifiedAt })
    .from(schema.campaign)
    .where(
      and(
        eq(schema.campaign.userId, userId),
        eq(schema.campaign.domain, domain),
        isNotNull(schema.campaign.verifiedAt),
        LIVE_CAMPAIGN,
      ),
    )
    .orderBy(asc(schema.campaign.verifiedAt))
    .limit(1);
  return row?.verifiedAt ?? null;
}

/**
 * The one insert behind a campaign. A booking runs it inside the transaction
 * that also charges the slot, so a short balance leaves no campaign behind.
 */
export async function insertCampaign(
  tx: Tx,
  userId: string,
  input: CreateCampaignInput,
  now: Date,
): Promise<CampaignRow> {
  const domain = requireDomain(input.url);
  const verifiedAt = await domainVerifiedAt(tx, userId, domain);
  const [row] = await tx
    .insert(schema.campaign)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: input.name,
      url: input.url,
      domain,
      // A verified domain needs no second check, so the campaign starts running.
      state: verifiedAt ? "active" : "draft",
      verifiedAt,
      verificationToken: randomBytes(16).toString("hex"),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new HTTPException(500, { message: "Insert failed" });
  return row;
}

export async function createCampaign(userId: string, input: CreateCampaignInput) {
  const row = await insertCampaign(db, userId, input, new Date());
  return single(row);
}

export async function updateCampaign(
  userId: string,
  campaignId: string,
  input: UpdateCampaignInput,
) {
  const existing = await getOwnedCampaign(userId, campaignId);
  if (existing.state === "archived") {
    throw new HTTPException(409, { message: "Campaign is archived" });
  }

  const patch: Partial<typeof schema.campaign.$inferInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.url !== undefined) {
    const domain = requireDomain(input.url);
    patch.url = input.url;
    if (domain !== existing.domain) {
      // A new domain needs new proof of ownership, so the campaign stops running.
      // A member who already proved the new domain keeps that proof.
      const verifiedAt = await domainVerifiedAt(db, userId, domain);
      patch.domain = domain;
      patch.verifiedAt = verifiedAt;
      // Proof of the new domain leaves the campaign where it was; a campaign the
      // advertiser had paused stays paused. No proof sends it back to draft.
      if (!verifiedAt) patch.state = "draft";
      else if (existing.state === "draft") patch.state = "active";
    }
  }
  if (input.state !== undefined) {
    // An unverified domain may not run. The check gates the campaign; a person
    // gates the listings under it. A domain change in this same request clears
    // the proof, so the patch wins over the stored value.
    const verifiedAt = "verifiedAt" in patch ? patch.verifiedAt : existing.verifiedAt;
    if (input.state === "active" && !verifiedAt) {
      throw new HTTPException(409, { message: "Verify the domain before you run the campaign" });
    }
    // A slot does not pause: the term runs to its end whatever the member does.
    if (input.state === "paused" && (await hasLiveSlot(db, campaignId))) {
      throw new HTTPException(409, { message: SLOT_DOES_NOT_PAUSE });
    }
    patch.state = input.state;
  }

  const row = await db.transaction(async (tx) => {
    const [updated] = await tx
      .update(schema.campaign)
      .set(patch)
      .where(eq(schema.campaign.id, campaignId))
      .returning();
    if (!updated) throw new HTTPException(404, { message: "Campaign not found" });
    // A move to a domain this member already proved is a verification too, so
    // a booked slot whose creative is approved starts its term here.
    if (patch.verifiedAt) await startSlot(tx, campaignId, patch.updatedAt ?? new Date());
    return updated;
  });
  return single(row);
}

/**
 * A delete is an archive. Money has moved against the listings under this
 * campaign, and the ledger still references the plays that carried them.
 */
export async function archiveCampaign(userId: string, campaignId: string) {
  await getOwnedCampaign(userId, campaignId);
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(schema.campaign)
      .set({ state: "archived", updatedAt: now })
      .where(eq(schema.campaign.id, campaignId));
    await tx
      .update(schema.listing)
      .set({ state: "archived", updatedAt: now })
      .where(eq(schema.listing.campaignId, campaignId));
    // A booking that never ran gives its charge back; a running one ends.
    await closeSlot(tx, campaignId, now);
  });
  return { id: campaignId };
}

export async function verifyCampaign(userId: string, campaignId: string) {
  const existing = await getOwnedCampaign(userId, campaignId);
  const result = await verifyDomain(existing.domain, existing.verificationToken);
  if (result.verified) {
    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(schema.campaign)
        .set({
          verifiedAt: now,
          // A verified draft starts running. The advertiser asked for that when
          // they created it; the check was the only thing holding it.
          state: existing.state === "draft" ? "active" : existing.state,
          updatedAt: now,
        })
        .where(eq(schema.campaign.id, campaignId));
      // The domain was the last gate, or the review still is; either way the
      // slot's term starts only when both are open.
      await startSlot(tx, campaignId, now);
    });
  }
  return result;
}
