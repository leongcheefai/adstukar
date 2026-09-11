import { economy } from "@repo/config/economy";
import type {
  CreateDeviceInput,
  EligibleListing,
  SetExcludedTermsInput,
  SetPromotionInput,
  SetVetoedListingsInput,
  UpdateDeviceInput,
} from "@repo/contracts";
import { db, schema } from "@repo/db";
import { and, asc, desc, eq, inArray, isNotNull, ne } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { generateApiKey, generateDeviceId, normalizeTerms } from "./keys";

type DeviceRow = typeof schema.device.$inferSelect;

const LIVE_DEVICE = ne(schema.device.state, "archived");

async function termsFor(deviceIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (deviceIds.length === 0) return map;
  const rows = await db
    .select()
    .from(schema.excludedTerm)
    .where(inArray(schema.excludedTerm.deviceId, deviceIds));
  for (const row of rows) {
    const list = map.get(row.deviceId) ?? [];
    list.push(row.phrase);
    map.set(row.deviceId, list);
  }
  return map;
}

async function vetoesFor(deviceIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (deviceIds.length === 0) return map;
  const rows = await db
    .select()
    .from(schema.vetoedListing)
    .where(inArray(schema.vetoedListing.deviceId, deviceIds));
  for (const row of rows) {
    const list = map.get(row.deviceId) ?? [];
    list.push(row.listingId);
    map.set(row.deviceId, list);
  }
  return map;
}

function withFilters(
  rows: DeviceRow[],
  terms: Map<string, string[]>,
  vetoes: Map<string, string[]>,
) {
  return rows.map((device) => ({
    device,
    excludedTerms: terms.get(device.id) ?? [],
    vetoedListingIds: vetoes.get(device.id) ?? [],
  }));
}

async function single(device: DeviceRow) {
  const ids = [device.id];
  const [terms, vetoes] = await Promise.all([termsFor(ids), vetoesFor(ids)]);
  const [item] = withFilters([device], terms, vetoes);
  if (!item) throw new HTTPException(500, { message: "Device vanished" });
  return item;
}

/** Reads the device back from the database, so a caller always sees what was written. */
async function reload(deviceId: string) {
  const [row] = await db
    .select()
    .from(schema.device)
    .where(eq(schema.device.id, deviceId))
    .limit(1);
  if (!row) throw new HTTPException(404, { message: "Device not found" });
  return single(row);
}

export async function listDevices(userId: string) {
  const rows = await db
    .select()
    .from(schema.device)
    .where(and(eq(schema.device.userId, userId), LIVE_DEVICE))
    .orderBy(desc(schema.device.createdAt));
  const ids = rows.map((d) => d.id);
  const [terms, vetoes] = await Promise.all([termsFor(ids), vetoesFor(ids)]);
  return withFilters(rows, terms, vetoes);
}

export async function getOwnedDevice(userId: string, deviceId: string) {
  const [row] = await db
    .select()
    .from(schema.device)
    .where(and(eq(schema.device.id, deviceId), eq(schema.device.userId, userId)))
    .limit(1);
  if (!row) throw new HTTPException(404, { message: "Device not found" });
  return row;
}

export async function createDevice(userId: string, input: CreateDeviceInput) {
  const now = new Date();
  const [row] = await db
    .insert(schema.device)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: input.name,
      deviceId: generateDeviceId(),
      // A placeholder. The column is unique and NOT NULL, so a row needs one from
      // the start, but approval mints the key CapyTV actually runs on and the
      // dashboard shows nothing until then.
      apiKey: generateApiKey(),
      venueType: input.venueType,
      location: input.location,
      photoUrl: input.photoUrl ?? null,
      openHour: input.openHour ?? null,
      closeHour: input.closeHour ?? null,
      timezone: input.timezone ?? null,
      dailyPlayCap: economy.caps.dailyPlaysPerDevice,
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new HTTPException(500, { message: "Insert failed" });
  return single(row);
}

export async function updateDevice(userId: string, deviceId: string, input: UpdateDeviceInput) {
  const existing = await getOwnedDevice(userId, deviceId);
  if (existing.state === "archived") {
    throw new HTTPException(409, { message: "Device is archived" });
  }

  const patch: Partial<typeof schema.device.$inferInsert> = { updatedAt: new Date() };
  if (input.name !== undefined) patch.name = input.name;
  if (input.location !== undefined) patch.location = input.location;
  if (input.venueType !== undefined) patch.venueType = input.venueType;
  if (input.photoUrl !== undefined) patch.photoUrl = input.photoUrl ?? null;
  if (input.openHour !== undefined) patch.openHour = input.openHour ?? null;
  if (input.closeHour !== undefined) patch.closeHour = input.closeHour ?? null;
  if (input.timezone !== undefined) patch.timezone = input.timezone ?? null;

  // The tier is priced on the room, so a moved screen is a new screen to review.
  // Nothing else here is: the name is a label, the photo is evidence about the
  // room rather than a change to it, and the stated hours are what the payout
  // review measures the screen against rather than what prices it.
  //
  // `approvedAt` stays. It records when this screen was first approved, and that
  // is what stops a second approval from minting a new key and blacking out a
  // screen somebody has already paired. `state` is what stops it serving.
  if (input.location !== undefined || input.venueType !== undefined) {
    patch.state = "pending";
    patch.rejectionReason = null;
  }

  const [row] = await db
    .update(schema.device)
    .set(patch)
    .where(eq(schema.device.id, deviceId))
    .returning();
  if (!row) throw new HTTPException(404, { message: "Device not found" });
  return single(row);
}

export async function rotateApiKey(userId: string, deviceId: string) {
  await getOwnedDevice(userId, deviceId);
  const [row] = await db
    .update(schema.device)
    .set({ apiKey: generateApiKey(), updatedAt: new Date() })
    .where(eq(schema.device.id, deviceId))
    .returning();
  if (!row) throw new HTTPException(404, { message: "Device not found" });
  return single(row);
}

export async function setExcludedTerms(
  userId: string,
  deviceId: string,
  input: SetExcludedTermsInput,
) {
  const device = await getOwnedDevice(userId, deviceId);
  const phrases = normalizeTerms(input.phrases);
  await db.transaction(async (tx) => {
    await tx.delete(schema.excludedTerm).where(eq(schema.excludedTerm.deviceId, deviceId));
    if (phrases.length > 0) {
      await tx
        .insert(schema.excludedTerm)
        .values(phrases.map((phrase) => ({ id: crypto.randomUUID(), deviceId, phrase })));
    }
  });
  return single(device);
}

/**
 * Every approved listing that could reach this screen, with the ones this device
 * already refuses marked. It is the list the distributor vetoes from, so it shows
 * what the creative says and never whose account bought it.
 */
export async function listEligibleListings(
  userId: string,
  deviceId: string,
): Promise<EligibleListing[]> {
  const device = await getOwnedDevice(userId, deviceId);
  const [rows, vetoes] = await Promise.all([
    db
      .select({
        listingId: schema.listing.id,
        name: schema.campaign.name,
        tagline: schema.listing.tagline,
        logoUrl: schema.listing.logoUrl,
      })
      .from(schema.listing)
      .innerJoin(schema.campaign, eq(schema.campaign.id, schema.listing.campaignId))
      .where(
        and(
          eq(schema.listing.state, "approved"),
          isNotNull(schema.campaign.verifiedAt),
          // A member never vetoes their own creative onto their own screen: it
          // was never eligible for it in the first place.
          ne(schema.campaign.userId, device.userId),
        ),
      )
      .orderBy(asc(schema.campaign.name), asc(schema.listing.createdAt))
      // Bounded by exactly what the veto list may hold, so the page a
      // distributor sees can never be larger than the set they may save.
      .limit(economy.maxVetoesPerDevice),
    vetoesFor([deviceId]),
  ]);

  const vetoed = new Set(vetoes.get(deviceId) ?? []);
  return rows.map((row) => ({ ...row, vetoed: vetoed.has(row.listingId) }));
}

/**
 * Replaces the whole veto list. The dashboard shows every eligible listing at
 * once, so it always knows the full set, and replacing means a second tab cannot
 * quietly re-admit a listing this one refused.
 */
export async function setVetoedListings(
  userId: string,
  deviceId: string,
  input: SetVetoedListingsInput,
) {
  const device = await getOwnedDevice(userId, deviceId);
  const wanted = [...new Set(input.listingIds)];

  await db.transaction(async (tx) => {
    await tx.delete(schema.vetoedListing).where(eq(schema.vetoedListing.deviceId, deviceId));
    if (wanted.length === 0) return;
    // Only real listings: an unknown id would break the foreign key and take the
    // whole edit down with it.
    const known = await tx
      .select({ id: schema.listing.id })
      .from(schema.listing)
      .where(inArray(schema.listing.id, wanted));
    if (known.length === 0) return;
    await tx.insert(schema.vetoedListing).values(
      known.map((listing) => ({
        id: crypto.randomUUID(),
        deviceId,
        listingId: listing.id,
      })),
    );
  });
  return single(device);
}

/**
 * The distributor's own promotion. It plays free when nothing paid is eligible,
 * so it moves no points and never goes through moderation.
 *
 * The fields go together: a promotion with no name or no tagline is no promotion,
 * and the loop falls back to the CapyAds card.
 */
export async function setPromotion(userId: string, deviceId: string, input: SetPromotionInput) {
  await getOwnedDevice(userId, deviceId);
  const complete = Boolean(input.name && input.tagline);
  await db
    .update(schema.device)
    .set({
      promotionName: complete ? (input.name ?? null) : null,
      promotionTagline: complete ? (input.tagline ?? null) : null,
      promotionUrl: complete ? (input.url ?? null) : null,
      promotionLogoUrl: complete ? (input.logoUrl ?? null) : null,
      updatedAt: new Date(),
    })
    .where(eq(schema.device.id, deviceId));
  return reload(deviceId);
}

/** A delete is an archive: plays reference the placements under this device. */
export async function archiveDevice(userId: string, deviceId: string) {
  await getOwnedDevice(userId, deviceId);
  await db
    .update(schema.device)
    .set({ state: "archived", updatedAt: new Date() })
    .where(eq(schema.device.id, deviceId));
  return { id: deviceId };
}
