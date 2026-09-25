import { release } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { describe, expect, it } from "vitest";
import { createPresetInput } from "../inputs/presets";
import { feedbackContract } from "./feedback";
import { presetMediaContract } from "./preset-media";
import { releaseContract } from "./release";
import { slotContract } from "./slot";

describe("derived entity contracts", () => {
  it("serializes release Dates to ISO strings", () => {
    const result = releaseContract.parse({
      id: "1",
      tag: "v1.0.0",
      name: "First",
      body: null,
      url: "https://example.com/1",
      prerelease: false,
      publishedAt: new Date("2026-02-03T00:00:00.000Z"),
      syncedAt: new Date("2026-02-04T00:00:00.000Z"),
    });
    expect(result).toEqual({
      id: "1",
      tag: "v1.0.0",
      name: "First",
      body: null,
      url: "https://example.com/1",
      prerelease: false,
      publishedAt: "2026-02-03T00:00:00.000Z",
      syncedAt: "2026-02-04T00:00:00.000Z",
    });
  });

  it("serializes feedback createdAt to an ISO string and keeps the member id off the wire", () => {
    const result = feedbackContract.parse({
      id: "f1",
      userId: "u1",
      type: "bug",
      message: "The clock is one hour behind.",
      createdAt: new Date("2026-09-21T01:02:03.000Z"),
      resolvedAt: null,
    });
    expect(result).toEqual({
      id: "f1",
      type: "bug",
      message: "The clock is one hour behind.",
      createdAt: "2026-09-21T01:02:03.000Z",
      resolvedAt: null,
    });
    expect(result).not.toHaveProperty("userId");
  });

  it("keeps a preset's bucket key and author off the wire", () => {
    const result = presetMediaContract.parse({
      id: "p1",
      kind: "video",
      name: "Sea",
      key: "presets/a1/00000000-0000-0000-0000-000000000000.mp4",
      url: "https://cdn.test/sea.mp4",
      size: 1234,
      createdBy: "a1",
      createdAt: new Date("2026-09-25T00:00:00.000Z"),
    });
    expect(result).toEqual({
      id: "p1",
      kind: "video",
      name: "Sea",
      url: "https://cdn.test/sea.mp4",
      size: 1234,
      createdAt: "2026-09-25T00:00:00.000Z",
    });
  });

  it("takes a preset key only from the presets prefix", () => {
    const uuid = "0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0";
    const ok = (key: string) => createPresetInput.safeParse({ key, name: "x" }).success;
    expect(ok(`presets/admin1/${uuid}.mp4`)).toBe(true);
    expect(ok(`avatars/admin1/${uuid}.png`)).toBe(false);
    expect(ok(`presets/admin1/../avatars/${uuid}.png`)).toBe(false);
    expect(ok(`presets/admin1/${uuid}.gif`)).toBe(false);
  });

  it("serializes every slot timestamp to an ISO string and keeps nulls", () => {
    const result = slotContract.parse({
      id: "s1",
      userId: "u1",
      campaignId: "c1",
      position: 7,
      state: "booked",
      amount: 20_000,
      bookedAt: new Date("2026-09-21T01:00:00.000Z"),
      startsAt: null,
      endsAt: null,
      endedAt: null,
      createdAt: new Date("2026-09-21T01:00:00.000Z"),
    });
    expect(result).toEqual({
      id: "s1",
      campaignId: "c1",
      position: 7,
      state: "booked",
      amount: 20_000,
      bookedAt: "2026-09-21T01:00:00.000Z",
      startsAt: null,
      endsAt: null,
      endedAt: null,
      createdAt: "2026-09-21T01:00:00.000Z",
    });
    expect(result).not.toHaveProperty("userId");
  });

  it("throws at construction when a picked column no longer exists on the table", () => {
    // Guards the allowlist's protective property: TypeScript does NOT catch a stale
    // pick key when other valid keys are present, so this runtime throw is the alarm.
    // `as never` is required and sanctioned here ONLY to get past the type layer so this
    // test can exercise the runtime guard — do not "clean up" by removing it.
    expect(() =>
      createSelectSchema(release).pick({ id: true, tag: true, noSuchColumn: true } as never),
    ).toThrow(/Unrecognized key/);
  });
});
