import type { LoopBand } from "@repo/contracts";
import { describe, expect, it } from "vitest";
import { type RingSlot, planRingLap } from "./ring";

const brand = (position: number, name = "Acme"): LoopBand => ({
  position,
  kind: "brand",
  name,
  tagline: "Tools for makers",
  logoUrl: null,
  url: "https://acme.test/",
});

const slot = (position: number, over: Partial<RingSlot> = {}): RingSlot => ({
  position,
  listingId: `listing-${position}`,
  userId: "advertiser",
  verified: true,
  ...over,
});

const noFilters = { phrases: [], vetoed: new Set<string>() };

describe("planRingLap", () => {
  it("keeps the ring order and pays each brand once", () => {
    const bands: LoopBand[] = [
      brand(1),
      { position: 2, kind: "open" },
      { position: 3, kind: "held" },
    ];

    const lap = planRingLap({ bands, slots: [slot(1)], ownerId: "owner", filters: noFilters });

    expect(lap.map((b) => b.position)).toEqual([1, 2, 3]);
    expect(lap[0]).toMatchObject({ kind: "brand", listingId: "listing-1" });
    expect(lap[1]).toEqual({ position: 2, kind: "open" });
    expect(lap[2]).toEqual({ position: 3, kind: "held" });
  });

  it("shows the owner's own brand and pays nothing for it", () => {
    const lap = planRingLap({
      bands: [brand(1)],
      slots: [slot(1, { userId: "owner" })],
      ownerId: "owner",
      filters: noFilters,
    });

    expect(lap[0]).toMatchObject({ kind: "brand", listingId: null });
  });

  it("pays nothing for a campaign whose domain is not verified", () => {
    const lap = planRingLap({
      bands: [brand(1)],
      slots: [slot(1, { verified: false })],
      ownerId: "owner",
      filters: noFilters,
    });

    expect(lap[0]).toMatchObject({ kind: "brand", listingId: null });
  });

  it("prints a vetoed brand as open on this screen", () => {
    const lap = planRingLap({
      bands: [brand(1)],
      slots: [slot(1)],
      ownerId: "owner",
      filters: { phrases: [], vetoed: new Set(["listing-1"]) },
    });

    expect(lap[0]).toEqual({ position: 1, kind: "open" });
  });

  it("prints a brand that reads like an excluded term as open", () => {
    const lap = planRingLap({
      bands: [brand(1, "Vape House")],
      slots: [slot(1)],
      ownerId: "owner",
      filters: { phrases: ["vape"], vetoed: new Set() },
    });

    expect(lap[0]).toEqual({ position: 1, kind: "open" });
  });

  it("pays nothing for a brand band with no live slot behind it", () => {
    const lap = planRingLap({ bands: [brand(1)], slots: [], ownerId: "owner", filters: noFilters });

    expect(lap[0]).toMatchObject({ kind: "brand", listingId: null });
  });
});
