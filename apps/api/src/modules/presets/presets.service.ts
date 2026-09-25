import { acceptsImage, acceptsVideo, mediaKindOf } from "@repo/config/media";
import type { CreatePresetInput, UpdatePresetInput } from "@repo/contracts";
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
 * Every preset, oldest first. A member's library shows them in this order,
 * before the member's own files, and the admin desk lists them the same way.
 */
export async function listPresets() {
  const items = await db
    .select()
    .from(schema.presetMedia)
    .orderBy(asc(schema.presetMedia.createdAt), asc(schema.presetMedia.id));
  return { items };
}

/**
 * Records a file the admin already PUT through the preset presign. The size
 * and the type come off the stored object, not off the request, so a row can
 * only describe a file that is really there, inside the caps a screen takes.
 * A file outside them leaves the bucket again.
 */
export async function createPreset(
  adminId: string,
  input: CreatePresetInput,
  storage: PresetStorage = bucket,
) {
  const [taken] = await db
    .select({ id: schema.presetMedia.id })
    .from(schema.presetMedia)
    .where(eq(schema.presetMedia.key, input.key))
    .limit(1);
  if (taken) throw new HTTPException(409, { message: "That file is already a preset" });

  const stored = await storage.head(input.key);
  if (!stored) throw new HTTPException(422, { message: "The file never reached storage" });

  const file = { type: stored.contentType, size: stored.size };
  const kind = mediaKindOf(stored.contentType);
  if (!kind || !(acceptsImage(file) || acceptsVideo(file))) {
    await removeQuietly(storage, input.key);
    throw new HTTPException(422, { message: "The file is not a picture or a clip a screen takes" });
  }

  const [row] = await db
    .insert(schema.presetMedia)
    .values({
      id: crypto.randomUUID(),
      kind,
      name: input.name,
      key: input.key,
      url: storage.urlOf(input.key),
      size: stored.size,
      createdBy: adminId,
    })
    .returning();
  if (!row) throw new HTTPException(500, { message: "The preset was not saved" });
  return row;
}

export async function renamePreset(presetId: string, input: UpdatePresetInput) {
  const [row] = await db
    .update(schema.presetMedia)
    .set({ name: input.name })
    .where(eq(schema.presetMedia.id, presetId))
    .returning();
  if (!row) throw new HTTPException(404, { message: "Preset not found" });
  return row;
}

/**
 * Takes the preset out of every library, then out of the bucket. The row goes
 * first: a set that already loaded the list skips a file that fails to load,
 * and a row pointing at nothing would break every library that loads next.
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
