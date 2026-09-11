import { describe, expect, it } from "vitest";
import { listingStateChange } from "./lifecycle";

describe("listingStateChange", () => {
  it("pauses an approved listing", () => {
    expect(listingStateChange("approved", "paused")).toEqual({ ok: true, state: "paused" });
  });

  it("starts a paused listing again, and keeps its approval", () => {
    expect(listingStateChange("paused", "approved")).toEqual({ ok: true, state: "approved" });
  });

  it("refuses to pause a listing the queue has not passed yet", () => {
    const result = listingStateChange("pending", "paused");
    expect(result.ok).toBe(false);
  });

  it("refuses to pause a rejected listing", () => {
    expect(listingStateChange("rejected", "paused").ok).toBe(false);
  });

  it("refuses to approve a listing the advertiser never paused", () => {
    expect(listingStateChange("pending", "approved").ok).toBe(false);
  });

  it("refuses to move an archived listing at all", () => {
    expect(listingStateChange("archived", "approved").ok).toBe(false);
    expect(listingStateChange("archived", "paused").ok).toBe(false);
  });

  it("takes a listing that already holds the state as done", () => {
    expect(listingStateChange("paused", "paused")).toEqual({ ok: true, state: "paused" });
    expect(listingStateChange("approved", "approved")).toEqual({ ok: true, state: "approved" });
  });
});
