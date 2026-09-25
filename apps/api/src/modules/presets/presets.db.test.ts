import { media } from "@repo/config/media";
import { db, schema } from "@repo/db";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, it } from "vitest";
import { makeMember, truncateAll } from "../../test/fixtures";
import type { StoredObject } from "../uploads/uploads.service";
import {
  type PresetStorage,
  createPreset,
  deletePreset,
  listPresets,
  renamePreset,
} from "./presets.service";

/** A bucket in memory: what the admin PUT, and what the service took out again. */
function fakeBucket(objects: Record<string, StoredObject> = {}) {
  const removed: string[] = [];
  const storage: PresetStorage = {
    head: async (key) => objects[key] ?? null,
    remove: async (key) => {
      removed.push(key);
    },
    urlOf: (key) => `https://cdn.test/${key}`,
  };
  return { storage, removed };
}

const key = (ext: string) => `presets/admin/${crypto.randomUUID()}.${ext}`;

async function statusOf(promise: Promise<unknown>): Promise<number | null> {
  try {
    await promise;
    return null;
  } catch (err) {
    return err instanceof HTTPException ? err.status : null;
  }
}

describe("createPreset", () => {
  beforeEach(truncateAll);

  it("records the size and the kind storage holds, not what the request says", async () => {
    const admin = await makeMember("admin");
    const clip = key("mp4");
    const { storage } = fakeBucket({ [clip]: { size: 1234, contentType: "video/mp4" } });

    const row = await createPreset(admin.id, { key: clip, name: "Sea" }, storage);

    expect(row).toMatchObject({
      kind: "video",
      name: "Sea",
      size: 1234,
      url: `https://cdn.test/${clip}`,
      createdBy: admin.id,
    });
  });

  it("refuses a key nothing was uploaded to", async () => {
    const admin = await makeMember("admin");
    const { storage } = fakeBucket();

    expect(await statusOf(createPreset(admin.id, { key: key("png"), name: "x" }, storage))).toBe(
      422,
    );
    expect((await listPresets()).items).toHaveLength(0);
  });

  it("refuses a file outside the caps, and takes it out of the bucket", async () => {
    const admin = await makeMember("admin");
    const big = key("png");
    const { storage, removed } = fakeBucket({
      [big]: { size: media.image.maxBytes + 1, contentType: "image/png" },
    });

    expect(await statusOf(createPreset(admin.id, { key: big, name: "x" }, storage))).toBe(422);
    expect(removed).toEqual([big]);
  });

  it("refuses the same file twice", async () => {
    const admin = await makeMember("admin");
    const pic = key("webp");
    const { storage } = fakeBucket({ [pic]: { size: 10, contentType: "image/webp" } });

    await createPreset(admin.id, { key: pic, name: "One" }, storage);

    expect(await statusOf(createPreset(admin.id, { key: pic, name: "Two" }, storage))).toBe(409);
  });
});

describe("listPresets", () => {
  beforeEach(truncateAll);

  it("lists oldest first", async () => {
    const admin = await makeMember("admin");
    const a = key("png");
    const b = key("png");
    const { storage } = fakeBucket({
      [a]: { size: 1, contentType: "image/png" },
      [b]: { size: 1, contentType: "image/png" },
    });
    const first = await createPreset(admin.id, { key: a, name: "First" }, storage);
    const second = await createPreset(admin.id, { key: b, name: "Second" }, storage);
    await db
      .update(schema.presetMedia)
      .set({ createdAt: new Date("2026-01-01T00:00:00Z") })
      .where(eq(schema.presetMedia.id, second.id));

    const { items } = await listPresets();

    expect(items.map((item) => item.id)).toEqual([second.id, first.id]);
  });
});

describe("renamePreset and deletePreset", () => {
  beforeEach(truncateAll);

  it("renames a preset, then deletes the row and the object", async () => {
    const admin = await makeMember("admin");
    const pic = key("jpg");
    const { storage, removed } = fakeBucket({ [pic]: { size: 5, contentType: "image/jpeg" } });
    const row = await createPreset(admin.id, { key: pic, name: "Old" }, storage);

    expect((await renamePreset(row.id, { name: "New" })).name).toBe("New");
    expect(await deletePreset(row.id, storage)).toEqual({ id: row.id });
    expect(removed).toEqual([pic]);
    expect((await listPresets()).items).toHaveLength(0);
  });

  it("answers 404 for a preset that is not there", async () => {
    expect(await statusOf(renamePreset("missing", { name: "x" }))).toBe(404);
    expect(await statusOf(deletePreset("missing", fakeBucket().storage))).toBe(404);
  });
});
