import { describe, expect, it } from "vitest";
import { createViewabilityTracker } from "./viewability";

const opts = { minRatio: 0.5, minMs: 1000 };

describe("createViewabilityTracker", () => {
  it("fires once after minMs of continuous visibility", () => {
    const tracker = createViewabilityTracker(opts);
    expect(tracker.update(1, 0)).toBe(false);
    expect(tracker.update(1, 500)).toBe(false);
    expect(tracker.update(1, 999)).toBe(false);
    expect(tracker.update(1, 1000)).toBe(true);
    expect(tracker.update(1, 2000)).toBe(false);
    expect(tracker.update(1, 5000)).toBe(false);
  });

  it("accepts a ratio exactly at minRatio", () => {
    const tracker = createViewabilityTracker(opts);
    expect(tracker.update(0.5, 0)).toBe(false);
    expect(tracker.update(0.5, 1000)).toBe(true);
  });

  it("resets the clock when the ratio dips below minRatio", () => {
    const tracker = createViewabilityTracker(opts);
    expect(tracker.update(1, 0)).toBe(false);
    expect(tracker.update(0.2, 500)).toBe(false);
    expect(tracker.update(1, 600)).toBe(false);
    expect(tracker.update(1, 1500)).toBe(false);
    expect(tracker.update(1, 1600)).toBe(true);
  });

  it("never fires while below minRatio", () => {
    const tracker = createViewabilityTracker(opts);
    expect(tracker.update(0, 0)).toBe(false);
    expect(tracker.update(0.49, 1000)).toBe(false);
    expect(tracker.update(0.1, 10_000)).toBe(false);
    expect(tracker.update(0, 100_000)).toBe(false);
  });

  it("does not fire again after a dip and a fresh visible run", () => {
    const tracker = createViewabilityTracker(opts);
    tracker.update(1, 0);
    expect(tracker.update(1, 1000)).toBe(true);
    tracker.update(0, 1100);
    tracker.update(1, 1200);
    expect(tracker.update(1, 3000)).toBe(false);
  });
});
