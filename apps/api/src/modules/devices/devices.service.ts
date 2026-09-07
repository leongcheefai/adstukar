import { economy } from "@repo/config/economy";
import type { CreateDeviceInput, SetExcludedTermsInput, UpdateDeviceInput } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { and, desc, eq, inArray, ne } from "drizzle-orm";
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

function withTerms(rows: DeviceRow[], terms: Map<string, string[]>) {
  return rows.map((device) => ({
    device,
    excludedTerms: terms.get(device.id) ?? [],
  }));
}

async function single(device: DeviceRow) {
  const [item] = withTerms([device], await termsFor([device.id]));
  if (!item) throw new HTTPException(500, { message: "Device vanished" });
  return item;
}

export async function listDevices(userId: string) {
  const rows = await db
    .select()
    .from(schema.device)
    .where(and(eq(schema.device.userId, userId), LIVE_DEVICE))
    .orderBy(desc(schema.device.createdAt));
  return withTerms(rows, await termsFor(rows.map((d) => d.id)));
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
      deviceId: generateDeviceId(),
      apiKey: generateApiKey(),
      venueType: input.venueType,
      location: input.location,
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
  if (input.location !== undefined) patch.location = input.location;
  if (input.venueType !== undefined) patch.venueType = input.venueType;

  // The tier is priced on the room, so a moved screen is a new screen to review.
  if (input.location !== undefined || input.venueType !== undefined) {
    patch.state = "pending";
    patch.rejectionReason = null;
    patch.approvedAt = null;
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

/** A delete is an archive: plays reference the placements under this device. */
export async function archiveDevice(userId: string, deviceId: string) {
  await getOwnedDevice(userId, deviceId);
  await db
    .update(schema.device)
    .set({ state: "archived", updatedAt: new Date() })
    .where(eq(schema.device.id, deviceId));
  return { id: deviceId };
}
