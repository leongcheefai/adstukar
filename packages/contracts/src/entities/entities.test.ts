import { release } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { describe, expect, it } from "vitest";
import { feedbackContract } from "./feedback";
import { releaseContract } from "./release";

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
    });
    expect(result).toEqual({
      id: "f1",
      type: "bug",
      message: "The clock is one hour behind.",
      createdAt: "2026-09-21T01:02:03.000Z",
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
