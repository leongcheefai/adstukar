import type { RingBand, RingLap } from "@repo/contracts/types";
import { describe, expect, it } from "vitest";
import { lapsLeft, merge, takePlay } from "./ring-batch";

const now = new Date("2026-10-01T10:00:00Z");
const later = "2026-10-01T14:00:00Z";
const past = "2026-10-01T09:00:00Z";

type Brand = Extract<RingBand, { kind: "brand" }>;

const paid = (position: number, playId: string, expiresAt = later): Brand => ({
  position,
  kind: "brand",
  name: "Acme",
  tagline: "Tools",
  logoUrl: null,
  url: "https://acme.test/",
  playId,
  expiresAt,
});

const lap = (...bands: RingBand[]): RingLap => ({ bands });

describe("takePlay", () => {
  it("takes the play at that position from the first lap that still holds one", () => {
    const laps = [lap(paid(1, "a1"), paid(2, "a2")), lap(paid(1, "b1"), paid(2, "b2"))];

    const first = takePlay(laps, 1, now);
    const second = takePlay(first.laps, 1, now);

    expect(first.play?.playId).toBe("a1");
    expect(second.play?.playId).toBe("b1");
  });

  it("takes nothing for an open band or a brand that pays nothing", () => {
    const laps = [
      lap({ position: 1, kind: "open" }, { ...paid(2, "x"), playId: null, expiresAt: null }),
    ];

    expect(takePlay(laps, 1, now).play).toBeNull();
    expect(takePlay(laps, 2, now).play).toBeNull();
  });

  it("skips a play that has expired", () => {
    const laps = [lap(paid(1, "old", past)), lap(paid(1, "new"))];

    expect(takePlay(laps, 1, now).play?.playId).toBe("new");
  });
});

describe("lapsLeft", () => {
  it("counts the laps that still hold a reportable play", () => {
    const laps = [lap(paid(1, "a", past)), lap(paid(1, "b")), lap({ position: 1, kind: "open" })];

    expect(lapsLeft(laps, now)).toBe(1);
  });
});

describe("merge", () => {
  const firstPlay = (l: RingLap) => (l.bands[0]?.kind === "brand" ? l.bands[0].playId : null);

  it("keeps the laps still worth reporting, then adds the new ones", () => {
    const held = [lap(paid(1, "spent", past)), lap(paid(1, "keep"))];
    const fresh = [lap(paid(1, "new"))];

    expect(merge(held, fresh, now).map(firstPlay)).toEqual(["keep", "new"]);
  });

  it("keeps the last lap, unpaid, so the crawl still has bands to draw", () => {
    const merged = merge([lap(paid(1, "spent", past))], [], now);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.bands[0]).toMatchObject({ kind: "brand", playId: null, expiresAt: null });
  });

  it("is empty when there was nothing to draw", () => {
    expect(merge([], [], now)).toEqual([]);
  });
});
