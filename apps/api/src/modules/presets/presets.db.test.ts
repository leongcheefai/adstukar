import { media } from "@repo/config/media";
import { db, schema } from "@repo/db";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, it } from "vitest";
import { makeMember, truncateAll } from "../../test/fixtures";
import type { StoredObject } from "../uploads/uploads.service";
import {
  type PresetStorage,
  createCollection,
  createPreset,
  deleteCollection,
  deletePreset,
  listPresets,
  updateCollection,
  updatePreset,
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

async function makeCollection(adminId: string, name = "Jack Berry Collection") {
  return createCollection(adminId, {
    name,
    url: "https://unsplash.com/@first_designs",
    author: "Jack Berry",
  });
}

describe("createPreset", () => {
  beforeEach(truncateAll);

  it("records the size and the kind storage holds, into its collection", async () => {
    const admin = await makeMember("admin");
    const shelf = await makeCollection(admin.id);
    const pic = key("png");
    const { storage } = fakeBucket({ [pic]: { size: 1234, contentType: "image/png" } });

    const row = await createPreset(
      admin.id,
      { key: pic, name: "Sea", collectionId: shelf.id },
      storage,
    );

    expect(row).toMatchObject({
      kind: "image",
      name: "Sea",
      size: 1234,
      url: `https://cdn.test/${pic}`,
      collectionId: shelf.id,
      createdBy: admin.id,
    });
  });

  it("refuses a collection that is not there", async () => {
    const admin = await makeMember("admin");
    const pic = key("png");
    const { storage } = fakeBucket({ [pic]: { size: 1, contentType: "image/png" } });

    expect(
      await statusOf(
        createPreset(admin.id, { key: pic, name: "x", collectionId: "gone" }, storage),
      ),
    ).toBe(422);
  });

  it("refuses a key nothing was uploaded to", async () => {
    const admin = await makeMember("admin");
    const shelf = await makeCollection(admin.id);
    const { storage } = fakeBucket();

    expect(
      await statusOf(
        createPreset(admin.id, { key: key("png"), name: "x", collectionId: shelf.id }, storage),
      ),
    ).toBe(422);
    expect((await listPresets()).items).toHaveLength(0);
  });

  it("refuses a clip or a file outside the cap, and takes it out of the bucket", async () => {
    const admin = await makeMember("admin");
    const shelf = await makeCollection(admin.id);
    const big = key("png");
    const clip = key("mp4");
    const { storage, removed } = fakeBucket({
      [big]: { size: media.image.maxBytes + 1, contentType: "image/png" },
      [clip]: { size: 10, contentType: "video/mp4" },
    });

    const add = (k: string) =>
      createPreset(admin.id, { key: k, name: "x", collectionId: shelf.id }, storage);
    expect(await statusOf(add(big))).toBe(422);
    expect(await statusOf(add(clip))).toBe(422);
    expect(removed).toEqual([big, clip]);
  });

  it("refuses the same file twice", async () => {
    const admin = await makeMember("admin");
    const shelf = await makeCollection(admin.id);
    const pic = key("webp");
    const { storage } = fakeBucket({ [pic]: { size: 10, contentType: "image/webp" } });

    await createPreset(admin.id, { key: pic, name: "One", collectionId: shelf.id }, storage);

    expect(
      await statusOf(
        createPreset(admin.id, { key: pic, name: "Two", collectionId: shelf.id }, storage),
      ),
    ).toBe(409);
  });
});

describe("listPresets", () => {
  beforeEach(truncateAll);

  it("lists collections and presets oldest first", async () => {
    const admin = await makeMember("admin");
    const shelf = await makeCollection(admin.id);
    const a = key("png");
    const b = key("png");
    const { storage } = fakeBucket({
      [a]: { size: 1, contentType: "image/png" },
      [b]: { size: 1, contentType: "image/png" },
    });
    const first = await createPreset(
      admin.id,
      { key: a, name: "First", collectionId: shelf.id },
      storage,
    );
    const second = await createPreset(
      admin.id,
      { key: b, name: "Second", collectionId: shelf.id },
      storage,
    );
    await db
      .update(schema.presetMedia)
      .set({ createdAt: new Date("2026-01-01T00:00:00Z") })
      .where(eq(schema.presetMedia.id, second.id));

    const { collections, items } = await listPresets();

    expect(collections.map((c) => c.id)).toEqual([shelf.id]);
    expect(items.map((item) => item.id)).toEqual([second.id, first.id]);
  });
});

describe("updatePreset and deletePreset", () => {
  beforeEach(truncateAll);

  it("renames a preset, moves it, then deletes the row and the object", async () => {
    const admin = await makeMember("admin");
    const one = await makeCollection(admin.id, "One");
    const two = await makeCollection(admin.id, "Two");
    const pic = key("jpg");
    const { storage, removed } = fakeBucket({ [pic]: { size: 5, contentType: "image/jpeg" } });
    const row = await createPreset(
      admin.id,
      { key: pic, name: "Old", collectionId: one.id },
      storage,
    );

    expect((await updatePreset(row.id, { name: "New" })).name).toBe("New");
    expect(await updatePreset(row.id, { collectionId: two.id })).toMatchObject({
      name: "New",
      collectionId: two.id,
    });
    expect(await deletePreset(row.id, storage)).toEqual({ id: row.id });
    expect(removed).toEqual([pic]);
    expect((await listPresets()).items).toHaveLength(0);
  });

  it("will not move a clip from before collections into one", async () => {
    const admin = await makeMember("admin");
    const shelf = await makeCollection(admin.id);
    const [clip] = await db
      .insert(schema.presetMedia)
      .values({
        id: crypto.randomUUID(),
        kind: "video",
        name: "Sea",
        key: key("mp4"),
        url: "https://cdn.test/sea.mp4",
        size: 10,
      })
      .returning();
    if (!clip) throw new Error("no clip");

    expect(await statusOf(updatePreset(clip.id, { collectionId: shelf.id }))).toBe(422);
  });

  it("answers 404 for a preset that is not there", async () => {
    expect(await statusOf(updatePreset("missing", { name: "x" }))).toBe(404);
    expect(await statusOf(deletePreset("missing", fakeBucket().storage))).toBe(404);
  });
});

describe("collections", () => {
  beforeEach(truncateAll);

  it("edits a collection's name, link and credit", async () => {
    const admin = await makeMember("admin");
    const shelf = await makeCollection(admin.id);

    const row = await updateCollection(shelf.id, {
      name: "Harbour",
      url: "https://unsplash.com/@someone",
      author: null,
    });

    expect(row).toMatchObject({
      name: "Harbour",
      url: "https://unsplash.com/@someone",
      author: null,
    });
    expect(
      await statusOf(
        updateCollection("missing", { name: "x", url: "https://x.test", author: null }),
      ),
    ).toBe(404);
  });

  it("deletes a collection with its photos, rows first, then objects", async () => {
    const admin = await makeMember("admin");
    const shelf = await makeCollection(admin.id, "Gone");
    const kept = await makeCollection(admin.id, "Kept");
    const a = key("png");
    const b = key("png");
    const { storage, removed } = fakeBucket({
      [a]: { size: 1, contentType: "image/png" },
      [b]: { size: 1, contentType: "image/png" },
    });
    await createPreset(admin.id, { key: a, name: "A", collectionId: shelf.id }, storage);
    const stays = await createPreset(
      admin.id,
      { key: b, name: "B", collectionId: kept.id },
      storage,
    );

    expect(await deleteCollection(shelf.id, storage)).toEqual({ id: shelf.id });

    const { collections, items } = await listPresets();
    expect(collections.map((c) => c.id)).toEqual([kept.id]);
    expect(items.map((item) => item.id)).toEqual([stays.id]);
    expect(removed).toEqual([a]);
    expect(await statusOf(deleteCollection("missing", storage))).toBe(404);
  });
});
