import { describe, expect, it } from "vitest";
import { type CachedItem, dueAt, nextItem, playable } from "./schedule";

const item = (playId: string, expiresAt: string): CachedItem =>
  ({
    playId,
    expiresAt,
    format: "band",
    size: "medium",
    dwellSeconds: 12,
    gapSeconds: 180,
    house: false,
    listing: null,
    promotion: null,
  }) as CachedItem;

describe("playable", () => {
  const now = new Date("2026-09-01T12:00:00.000Z");
  it("drops a cached play the server would no longer count", () => {
    const live = item("p1", "2026-09-01T13:00:00.000Z");
    const dead = item("p2", "2026-09-01T11:00:00.000Z");
    expect(playable([live, dead], now).map((i) => i.playId)).toEqual(["p1"]);
  });
});

describe("nextItem", () => {
  const now = new Date("2026-09-01T12:00:00.000Z");
  it("takes the first play still worth showing", () => {
    const items = [item("stale", "2026-09-01T11:00:00.000Z"), item("live", "2026-09-01T13:00:00Z")];
    expect(nextItem(items, now)?.playId).toBe("live");
  });
  it("answers null when the whole batch went stale", () => {
    expect(nextItem([item("p1", "2026-09-01T11:00:00.000Z")], now)).toBeNull();
  });
});

describe("dueAt", () => {
  it("waits the dwell and then the gap before the next play", () => {
    const started = new Date("2026-09-01T12:00:00.000Z");
    expect(dueAt(started, { dwellSeconds: 12, gapSeconds: 180 }).toISOString()).toBe(
      "2026-09-01T12:03:12.000Z",
    );
  });
});
