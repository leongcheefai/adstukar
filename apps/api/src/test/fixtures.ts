import { economy } from "@repo/config/economy";
import { db, schema } from "@repo/db";
import type { CampaignState, ListingState, SlotState } from "@repo/db/enums";
import { tableNames } from "@repo/db/testing";
import { asc, eq, sql } from "drizzle-orm";

/**
 * Rows the database tests build on. Each helper writes the least a row needs
 * and returns it, so a test reads like the case it proves.
 */

let n = 0;
function next(prefix: string): string {
  n += 1;
  return `${prefix}-${n}-${crypto.randomUUID().slice(0, 8)}`;
}

/** Empties every table. Each file calls it before each test. */
export async function truncateAll(): Promise<void> {
  const names = tableNames()
    .map((name) => `"${name}"`)
    .join(", ");
  await db.execute(sql.raw(`truncate table ${names} restart identity cascade`));
}

export async function makeMember(role: string | null = null) {
  const id = next("user");
  const now = new Date();
  const [row] = await db
    .insert(schema.user)
    .values({
      id,
      name: id,
      email: `${id}@test.local`,
      emailVerified: true,
      role,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new Error("user insert failed");
  return row;
}

/** An approved screen with one band region. The key is what CapyTV sends. */
export async function makeDevice(
  userId: string,
  opts: { dailyPlayCap?: number; gapSeconds?: number } = {},
) {
  const id = next("device");
  const [device] = await db
    .insert(schema.device)
    .values({
      id,
      userId,
      name: id,
      deviceId: next("CAPY"),
      apiKey: next("dk"),
      location: "Front counter",
      state: "approved",
      dailyPlayCap: opts.dailyPlayCap ?? economy.caps.dailyPlaysPerDevice,
      approvedAt: new Date(),
    })
    .returning();
  if (!device) throw new Error("device insert failed");
  const [placement] = await db
    .insert(schema.placement)
    .values({
      id: next("placement"),
      deviceId: device.id,
      format: "band",
      size: "medium",
      dwellSeconds: economy.placement.dwellSeconds.default,
      gapSeconds: opts.gapSeconds ?? economy.placement.gapSeconds.min,
    })
    .returning();
  if (!placement) throw new Error("placement insert failed");
  return { device, placement };
}

/** A booked slot: the campaign, its creative, and the slot row, in the states asked for. */
export async function makeSlot(
  userId: string,
  opts: {
    slotState?: SlotState;
    listingState?: ListingState;
    campaignState?: CampaignState;
    verified?: boolean;
    position?: number;
  } = {},
) {
  const now = new Date();
  const [campaign] = await db
    .insert(schema.campaign)
    .values({
      id: next("campaign"),
      userId,
      name: "Acme",
      url: "https://acme.test/",
      domain: "acme.test",
      state: opts.campaignState ?? "active",
      verifiedAt: (opts.verified ?? true) ? now : null,
      verificationToken: next("tok"),
    })
    .returning();
  if (!campaign) throw new Error("campaign insert failed");
  const [listing] = await db
    .insert(schema.listing)
    .values({
      id: next("listing"),
      campaignId: campaign.id,
      tagline: "Tools for makers",
      state: opts.listingState ?? "approved",
    })
    .returning();
  if (!listing) throw new Error("listing insert failed");
  const state = opts.slotState ?? "running";
  const [slot] = await db
    .insert(schema.slot)
    .values({
      id: next("slot"),
      userId,
      campaignId: campaign.id,
      position: opts.position ?? 1,
      state,
      amount: 20_000,
      bookedAt: now,
      startsAt: state === "running" || state === "ended" ? now : null,
      endsAt: state === "running" || state === "ended" ? now : null,
    })
    .returning();
  if (!slot) throw new Error("slot insert failed");
  return { campaign, listing, slot };
}

/** Every ledger row one member holds, oldest first. */
export async function ledgerOf(userId: string) {
  return db
    .select()
    .from(schema.ledgerEntry)
    .where(eq(schema.ledgerEntry.userId, userId))
    .orderBy(asc(schema.ledgerEntry.createdAt));
}
