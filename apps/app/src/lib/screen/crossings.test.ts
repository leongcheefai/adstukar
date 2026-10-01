import { describe, expect, it } from "vitest";
import { type Sighting, emptyTracker, sideOf, spoilAll, track } from "./crossings";

/** 90% of a 60-second crossing. */
const MIN = 54_000;

const enter = (position: number, side: "left" | "right" = "right"): Sighting => ({
  position,
  inFrame: true,
  side,
});
const leave = (position: number, side: "left" | "right" = "left"): Sighting => ({
  position,
  inFrame: false,
  side,
});

describe("track", () => {
  it("counts a band that enters on the right and leaves on the left while visible", () => {
    const a = track(emptyTracker(), [enter(3)], 0, true, MIN);
    const b = track(a.tracker, [leave(3)], 60_000, true, MIN);

    expect(a.counted).toEqual([]);
    expect(b.counted).toEqual([3]);
  });

  it("does not count a band already in the frame when the set starts", () => {
    const a = track(emptyTracker(), [enter(3, "left")], 0, true, MIN);
    const b = track(a.tracker, [leave(3)], 30_000, true, MIN);

    expect(b.counted).toEqual([]);
  });

  it("does not count a crossing shorter than the minimum, such as a wound crawl", () => {
    const a = track(emptyTracker(), [enter(3)], 0, true, MIN);
    const b = track(a.tracker, [leave(3)], 2_000, true, MIN);

    expect(b.counted).toEqual([]);
  });

  it("does not count a band that leaves on the right", () => {
    const a = track(emptyTracker(), [enter(3)], 0, true, MIN);
    const b = track(a.tracker, [leave(3, "right")], 60_000, true, MIN);

    expect(b.counted).toEqual([]);
  });

  it("does not count a crossing the page was hidden for, and counts the next one", () => {
    const a = track(emptyTracker(), [enter(3)], 0, true, MIN);
    const b = track(spoilAll(a.tracker), [leave(3)], 60_000, true, MIN);
    const c = track(b.tracker, [enter(3)], 200_000, true, MIN);
    const d = track(c.tracker, [leave(3)], 260_000, true, MIN);

    expect(b.counted).toEqual([]);
    expect(d.counted).toEqual([3]);
  });

  it("does not count a band that entered while the page was hidden", () => {
    const a = track(emptyTracker(), [enter(3)], 0, false, MIN);
    const b = track(a.tracker, [leave(3)], 60_000, true, MIN);

    expect(b.counted).toEqual([]);
  });

  it("sees no leave and no enter when the lap resets and one copy replaces another", () => {
    const a = track(emptyTracker(), [enter(3)], 0, true, MIN);
    // Lap end: one copy of position 3 jumps out on the right as another jumps in.
    const reset = track(a.tracker, [leave(3, "right"), enter(3, "left")], 20_000, true, MIN);
    const b = track(reset.tracker, [leave(3)], 60_000, true, MIN);

    expect(reset.counted).toEqual([]);
    expect(b.counted).toEqual([3]);
  });
});

describe("sideOf", () => {
  it("names the half of the frame the band's centre is in", () => {
    const root = { left: 0, right: 1000 };

    expect(sideOf({ left: 990, right: 1190 }, root)).toBe("right");
    expect(sideOf({ left: -190, right: 10 }, root)).toBe("left");
  });
});
