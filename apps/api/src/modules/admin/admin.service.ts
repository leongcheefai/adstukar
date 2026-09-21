import { economy } from "@repo/config/economy";
import { db, schema } from "@repo/db";
import { and, asc, count, eq, ne } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { generateApiKey } from "../devices/keys";
import { postEntry } from "../ledger/ledger.service";
import { refundSlot, startSlot } from "../slots/term";

type DeviceTier = (typeof schema.DEVICE_TIERS)[number];

/**
 * Human moderation queue. An admin reviews each listing and each device; the
 * domain check is automatic and gates the campaign instead.
 *
 * AI pre-scoring is a later phase: it would add a score column and an ordering
 * here, nothing else.
 */
export async function listModerationQueue() {
  const listings = await db
    .select({
      listing: schema.listing,
      campaign: schema.campaign,
      owner: { name: schema.user.name, email: schema.user.email },
    })
    .from(schema.listing)
    .innerJoin(schema.campaign, eq(schema.campaign.id, schema.listing.campaignId))
    .innerJoin(schema.user, eq(schema.user.id, schema.campaign.userId))
    .where(eq(schema.listing.state, "pending"))
    .orderBy(asc(schema.listing.createdAt));

  const devices = await db
    .select({
      device: schema.device,
      owner: { name: schema.user.name, email: schema.user.email },
    })
    .from(schema.device)
    .innerJoin(schema.user, eq(schema.user.id, schema.device.userId))
    .where(eq(schema.device.state, "pending"))
    .orderBy(asc(schema.device.createdAt));

  return { listings, devices };
}

/**
 * Approving a member's first listing pays the welcome grant. The grant lot
 * neither refunds nor withdraws, so free money can never leave as cash.
 */
export async function approveListing(listingId: string, now: Date = new Date()) {
  return db.transaction(async (tx) => {
    const [found] = await tx
      .select({ listing: schema.listing, campaign: schema.campaign })
      .from(schema.listing)
      .innerJoin(schema.campaign, eq(schema.campaign.id, schema.listing.campaignId))
      .where(eq(schema.listing.id, listingId))
      .limit(1)
      .for("update", { of: schema.listing });
    if (!found) throw new HTTPException(404, { message: "Listing not found" });
    if (!found.campaign.verifiedAt) {
      throw new HTTPException(409, { message: "Domain not verified" });
    }

    const [row] = await tx
      .update(schema.listing)
      .set({ state: "approved", rejectionReason: null, updatedAt: now })
      .where(eq(schema.listing.id, listingId))
      .returning();
    if (!row) throw new HTTPException(404, { message: "Listing not found" });

    const ownerId = found.campaign.userId;
    const [approved] = await tx
      .select({ n: count() })
      .from(schema.listing)
      .innerJoin(schema.campaign, eq(schema.campaign.id, schema.listing.campaignId))
      .where(and(eq(schema.campaign.userId, ownerId), eq(schema.listing.state, "approved")));

    if ((approved?.n ?? 0) === 1) {
      await postEntry(tx, {
        userId: ownerId,
        delta: economy.grants.firstListingApproval,
        reason: "grant",
        lot: "granted",
        state: "settled",
        idempotencyKey: `grant:first-listing:${ownerId}`,
        now,
      });
    }
    // The review was the last gate, or the domain check still is; either way
    // the slot's term starts only when both are open.
    await startSlot(tx, found.campaign.id, now);
    return row;
  });
}

export async function rejectListing(listingId: string, reason: string, now: Date = new Date()) {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .update(schema.listing)
      .set({ state: "rejected", rejectionReason: reason, updatedAt: now })
      .where(and(eq(schema.listing.id, listingId), ne(schema.listing.state, "archived")))
      .returning();
    if (!row) throw new HTTPException(404, { message: "Listing not found" });
    // A refused creative on a booking that never ran gives the charge back.
    await refundSlot(tx, row.campaignId, now);
    return row;
  });
}

/**
 * Approval stamps the tier, and the tier sets the rate the device earns. It also
 * issues the key CapyTV runs on: registration writes a placeholder, and the key
 * a distributor is ever shown is the one an approval minted.
 *
 * A second approval — a moved screen came back for review — keeps the key it
 * already has, so re-approving a working screen does not black it out until
 * somebody walks over and pairs it again.
 */
export async function approveDevice(deviceId: string, tier: DeviceTier, now: Date = new Date()) {
  return db.transaction(async (tx) => {
    const [found] = await tx
      .select({ approvedAt: schema.device.approvedAt })
      .from(schema.device)
      .where(and(eq(schema.device.id, deviceId), ne(schema.device.state, "archived")))
      .limit(1)
      .for("update");
    if (!found) throw new HTTPException(404, { message: "Device not found" });

    const [row] = await tx
      .update(schema.device)
      .set({
        state: "approved",
        tier,
        rejectionReason: null,
        approvedAt: now,
        updatedAt: now,
        dailyPlayCap: economy.caps.dailyPlaysPerDevice,
        ...(found.approvedAt === null ? { apiKey: generateApiKey() } : {}),
      })
      .where(eq(schema.device.id, deviceId))
      .returning();
    if (!row) throw new HTTPException(404, { message: "Device not found" });
    return row;
  });
}

export async function rejectDevice(deviceId: string, reason: string, now: Date = new Date()) {
  const [row] = await db
    .update(schema.device)
    .set({ state: "rejected", rejectionReason: reason, approvedAt: null, updatedAt: now })
    .where(and(eq(schema.device.id, deviceId), ne(schema.device.state, "archived")))
    .returning();
  if (!row) throw new HTTPException(404, { message: "Device not found" });
  return row;
}
