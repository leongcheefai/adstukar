import { acceptsImage } from "@repo/config/media";
import type { CreatePresetInput, PresetCollectionInput, UpdatePresetInput } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { asc, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { log } from "../../lib/logger";
import {
  type StoredObject,
  deleteStoredObject,
  headStoredObject,
  publicUrlOf,
} from "../uploads/uploads.service";

/** The storage calls a preset makes. A test hands in its own. */
export type PresetStorage = {
  head: (key: string) => Promise<StoredObject | null>;
  remove: (key: string) => Promise<void>;
  urlOf: (key: string) => string;
};

const bucket: PresetStorage = {
  head: headStoredObject,
  remove: deleteStoredObject,
  urlOf: publicUrlOf,
};

/**
 * Every collection and every preset, oldest first. The wallpaper chooser shows
 * them in this order, and the admin desk lists them the same way.
 */
export async function listPresets() {
  const [collections, items] = await Promise.all([
    db
      .select()
      .from(schema.presetCollection)
      .orderBy(asc(schema.presetCollection.createdAt), asc(schema.presetCollection.id)),
    db
      .select()
      .from(schema.presetMedia)
      .orderBy(asc(schema.presetMedia.createdAt), asc(schema.presetMedia.id)),
  ]);
  return { collections, items };
}

export async function createCollection(adminId: string, input: PresetCollectionInput) {
  const [row] = await db
    .insert(schema.presetCollection)
    .values({
      id: crypto.randomUUID(),
      name: input.name,
      url: input.url,
      author: input.author,
      createdBy: adminId,
    })
    .returning();
  if (!row) throw new HTTPException(500, { message: "The collection was not saved" });
  return row;
}

export async function updateCollection(collectionId: string, input: PresetCollectionInput) {
  const [row] = await db
    .update(schema.presetCollection)
    .set({ name: input.name, url: input.url, author: input.author })
    .where(eq(schema.presetCollection.id, collectionId))
    .returning();
  if (!row) throw new HTTPException(404, { message: "Collection not found" });
  return row;
}

/**
 * Takes the collection and every photo in it off every set, then out of the
 * bucket. The rows go first, for the reason `deletePreset` gives.
 */
export async function deleteCollection(collectionId: string, storage: PresetStorage = bucket) {
  const { row, photos } = await db.transaction(async (tx) => {
    const photos = await tx
      .delete(schema.presetMedia)
      .where(eq(schema.presetMedia.collectionId, collectionId))
      .returning({ key: schema.presetMedia.key });
    const [row] = await tx
      .delete(schema.presetCollection)
      .where(eq(schema.presetCollection.id, collectionId))
      .returning();
    if (!row) throw new HTTPException(404, { message: "Collection not found" });
    return { row, photos };
  });
  for (const photo of photos) await removeQuietly(storage, photo.key);
  return { id: row.id };
}

async function assertCollection(collectionId: string) {
  const [found] = await db
    .select({ id: schema.presetCollection.id })
    .from(schema.presetCollection)
    .where(eq(schema.presetCollection.id, collectionId))
    .limit(1);
  if (!found) throw new HTTPException(422, { message: "That collection is not there" });
}

/**
 * Records a picture the admin already PUT through the preset presign, into one
 * collection. The size and the type come off the stored object, not off the
 * request, so a row can only describe a file that is really there, inside the
 * cap a screen takes. A wallpaper is a photo, so a clip is refused too. A file
 * refused leaves the bucket again.
 */
export async function createPreset(
  adminId: string,
  input: CreatePresetInput,
  storage: PresetStorage = bucket,
) {
  await assertCollection(input.collectionId);

  const [taken] = await db
    .select({ id: schema.presetMedia.id })
    .from(schema.presetMedia)
    .where(eq(schema.presetMedia.key, input.key))
    .limit(1);
  if (taken) throw new HTTPException(409, { message: "That file is already a preset" });

  const stored = await storage.head(input.key);
  if (!stored) throw new HTTPException(422, { message: "The file never reached storage" });

  if (!acceptsImage({ type: stored.contentType, size: stored.size })) {
    await removeQuietly(storage, input.key);
    throw new HTTPException(422, { message: "The file is not a picture a screen takes" });
  }

  const [row] = await db
    .insert(schema.presetMedia)
    .values({
      id: crypto.randomUUID(),
      kind: "image",
      name: input.name,
      key: input.key,
      url: storage.urlOf(input.key),
      size: stored.size,
      collectionId: input.collectionId,
      createdBy: adminId,
    })
    .returning();
  if (!row) throw new HTTPException(500, { message: "The preset was not saved" });
  return row;
}

/**
 * Renames a preset, moves it to another collection, or both. A clip recorded
 * before presets became wallpapers cannot move into one: the set plays photos.
 */
export async function updatePreset(presetId: string, input: UpdatePresetInput) {
  const [current] = await db
    .select({ kind: schema.presetMedia.kind })
    .from(schema.presetMedia)
    .where(eq(schema.presetMedia.id, presetId))
    .limit(1);
  if (!current) throw new HTTPException(404, { message: "Preset not found" });
  if (input.collectionId !== undefined) {
    if (current.kind !== "image") {
      throw new HTTPException(422, { message: "A wallpaper is a photo, not a clip" });
    }
    await assertCollection(input.collectionId);
  }

  const [row] = await db
    .update(schema.presetMedia)
    .set({
      ...(input.name !== undefined && { name: input.name }),
      ...(input.collectionId !== undefined && { collectionId: input.collectionId }),
    })
    .where(eq(schema.presetMedia.id, presetId))
    .returning();
  if (!row) throw new HTTPException(404, { message: "Preset not found" });
  return row;
}

/**
 * Takes the preset off every set, then out of the bucket. The row goes first:
 * a set that already loaded the list skips a file that fails to load, and a
 * row pointing at nothing would break every chooser that loads next.
 */
export async function deletePreset(presetId: string, storage: PresetStorage = bucket) {
  const [row] = await db
    .delete(schema.presetMedia)
    .where(eq(schema.presetMedia.id, presetId))
    .returning();
  if (!row) throw new HTTPException(404, { message: "Preset not found" });
  await removeQuietly(storage, row.key);
  return { id: row.id };
}

/** A failed delete leaves an orphan in the bucket, which costs storage and nothing else. */
async function removeQuietly(storage: PresetStorage, key: string) {
  try {
    await storage.remove(key);
  } catch (err) {
    log("warn", "preset_object_delete_failed", { key, err: String(err) });
  }
}
