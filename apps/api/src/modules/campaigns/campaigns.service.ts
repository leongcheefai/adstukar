import { randomBytes } from "node:crypto";
import { economy } from "@repo/config/economy";
import type { CreateCampaignInput, UpdateCampaignInput } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { and, asc, desc, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { domainFromUrl } from "../../lib/domain";
import type { Tx } from "../ledger/ledger.service";
import { spentTodayByCampaign } from "./spend";
import { verifyDomain } from "./verification";

type CampaignRow = typeof schema.campaign.$inferSelect;
type ListingRow = typeof schema.listing.$inferSelect;

/** Archived rows stay for the ledger to reference, and leave every list. */
const LIVE_CAMPAIGN = ne(schema.campaign.state, "archived");
const LIVE_LISTING = ne(schema.listing.state, "archived");

async function listingsFor(campaignIds: string[]): Promise<Map<string, ListingRow[]>> {
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

/**
 * A campaign travels with its listings and with what it has spent today, because
 * a budget nobody can see against the spend says nothing about how a campaign is
 * pacing.
 */
function withListings(
  rows: CampaignRow[],
  listings: Map<string, ListingRow[]>,
  spend: Map<string, number>,
) {
  return rows.map((campaign) => ({
    campaign,
    listings: listings.get(campaign.id) ?? [],
    spentToday: spend.get(campaign.id) ?? 0,
  }));
}

export async function listCampaigns(userId: string) {
  const rows = await db
    .select()
    .from(schema.campaign)
    .where(and(eq(schema.campaign.userId, userId), LIVE_CAMPAIGN))
    .orderBy(desc(schema.campaign.createdAt));
  const [listings, spend] = await Promise.all([
    listingsFor(rows.map((c) => c.id)),
    spentTodayByCampaign(db, new Date()),
  ]);
  return withListings(rows, listings, spend);
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
  const now = new Date();
  const [listings, spend] = await Promise.all([
    listingsFor([campaign.id]),
    spentTodayByCampaign(db, now, campaign.id),
  ]);
  const [item] = withListings([campaign], listings, spend);
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
      dailyBudget: input.dailyBudget ?? economy.caps.defaultDailyBudget,
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
  if (input.dailyBudget !== undefined) patch.dailyBudget = input.dailyBudget;
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
      //
      // A campaign the system stopped starts again, because the reason it was
      // stopped goes with the patch below. The pacing sweep stops it once more,
      // within minutes, if the money is still not there.
      if (!verifiedAt) patch.state = "draft";
      else if (existing.state === "draft" || existing.pauseReason !== null) patch.state = "active";
      patch.pauseReason = null;
      patch.pausedAt = null;
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
    patch.state = input.state;
    // A person moved this campaign, so the system's reason for stopping it is
    // gone. The resume job leaves a campaign with no reason alone.
    patch.pauseReason = null;
    patch.pausedAt = null;
  }

  const [row] = await db
    .update(schema.campaign)
    .set(patch)
    .where(eq(schema.campaign.id, campaignId))
    .returning();
  if (!row) throw new HTTPException(404, { message: "Campaign not found" });
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
  });
  return { id: campaignId };
}

export async function verifyCampaign(userId: string, campaignId: string) {
  const existing = await getOwnedCampaign(userId, campaignId);
  const result = await verifyDomain(existing.domain, existing.verificationToken);
  if (result.verified) {
    const now = new Date();
    await db
      .update(schema.campaign)
      .set({
        verifiedAt: now,
        // A verified draft starts running. The advertiser asked for that when
        // they created it; the check was the only thing holding it.
        state: existing.state === "draft" ? "active" : existing.state,
        updatedAt: now,
      })
      .where(eq(schema.campaign.id, campaignId));
  }
  return result;
}
