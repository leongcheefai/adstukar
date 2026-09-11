import type { CreatePlacementInput, UpdatePlacementInput } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { and, asc, count, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { getOwnedDevice } from "../devices/devices.service";

export async function listPlacements(userId: string, deviceId?: string) {
  const conditions = [eq(schema.device.userId, userId)];
  if (deviceId) conditions.push(eq(schema.placement.deviceId, deviceId));
  const rows = await db
    .select({ placement: schema.placement })
    .from(schema.placement)
    .innerJoin(schema.device, eq(schema.device.id, schema.placement.deviceId))
    .where(and(...conditions))
    .orderBy(asc(schema.placement.createdAt));
  return rows.map((r) => r.placement);
}

export async function getOwnedPlacement(userId: string, placementId: string) {
  const [row] = await db
    .select({ placement: schema.placement })
    .from(schema.placement)
    .innerJoin(schema.device, eq(schema.device.id, schema.placement.deviceId))
    .where(and(eq(schema.placement.id, placementId), eq(schema.device.userId, userId)))
    .limit(1);
  if (!row) throw new HTTPException(404, { message: "Placement not found" });
  return row.placement;
}

export async function createPlacement(userId: string, input: CreatePlacementInput) {
  const device = await getOwnedDevice(userId, input.deviceId);
  if (device.state === "archived") {
    throw new HTTPException(409, { message: "Device is archived" });
  }
  const [row] = await db
    .insert(schema.placement)
    .values({
      id: crypto.randomUUID(),
      deviceId: device.id,
      format: input.format,
      size: input.size,
      dwellSeconds: input.dwellSeconds,
      gapSeconds: input.gapSeconds,
      createdAt: new Date(),
    })
    .returning();
  if (!row) throw new HTTPException(500, { message: "Insert failed" });
  return row;
}

export async function updatePlacement(
  userId: string,
  placementId: string,
  input: UpdatePlacementInput,
) {
  await getOwnedPlacement(userId, placementId);
  const patch: Partial<typeof schema.placement.$inferInsert> = {};
  if (input.format !== undefined) patch.format = input.format;
  if (input.size !== undefined) patch.size = input.size;
  if (input.dwellSeconds !== undefined) patch.dwellSeconds = input.dwellSeconds;
  if (input.gapSeconds !== undefined) patch.gapSeconds = input.gapSeconds;

  const [row] = await db
    .update(schema.placement)
    .set(patch)
    .where(eq(schema.placement.id, placementId))
    .returning();
  if (!row) throw new HTTPException(404, { message: "Placement not found" });
  return row;
}

/**
 * A placement that never played holds nothing, so it really is deleted. One that
 * has played is where points came from, and the ledger reaches it through those
 * plays, so it stays. Archive the device instead.
 */
export async function deletePlacement(userId: string, placementId: string) {
  await getOwnedPlacement(userId, placementId);
  const [played] = await db
    .select({ n: count() })
    .from(schema.play)
    .where(eq(schema.play.placementId, placementId));
  if ((played?.n ?? 0) > 0) {
    throw new HTTPException(409, {
      message: "This placement has played. Archive the device instead.",
    });
  }
  await db.delete(schema.placement).where(eq(schema.placement.id, placementId));
  return { id: placementId };
}
