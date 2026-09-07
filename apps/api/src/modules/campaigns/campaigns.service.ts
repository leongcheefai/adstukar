import { randomBytes } from "node:crypto";
import { economy } from "@repo/config/economy";
import type { CreateCampaignInput, UpdateCampaignInput } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { and, asc, desc, eq, inArray, ne } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { domainFromUrl } from "../../lib/domain";
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
  return withListings(rows, await listingsFor(rows.map((c) => c.id)));
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
  const [item] = withListings([campaign], await listingsFor([campaign.id]));
  if (!item) throw new HTTPException(500, { message: "Campaign vanished" });
  return item;
}

function requireDomain(url: string): string {
  const domain = domainFromUrl(url);
  if (!domain) throw new HTTPException(400, { message: "URL must be a public http(s) address" });
  return domain;
}

export async function createCampaign(userId: string, input: CreateCampaignInput) {
  const domain = requireDomain(input.url);
  const now = new Date();
  const [row] = await db
    .insert(schema.campaign)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: input.name,
      url: input.url,
      domain,
      dailyBudget: input.dailyBudget ?? economy.caps.defaultDailyBudget,
      verificationToken: randomBytes(16).toString("hex"),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new HTTPException(500, { message: "Insert failed" });
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
      patch.domain = domain;
      patch.verifiedAt = null;
      patch.state = "draft";
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
 * A delete is an archive. Points have moved against the listings under this
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
