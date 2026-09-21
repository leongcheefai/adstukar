import { DAY_MS, centsToAmount, economy } from "@repo/config/economy";
import { describe, expect, it } from "vitest";
import {
  type LoopSlot,
  SLOT_PRICE,
  availability,
  canRefund,
  isLive,
  loopOf,
  termEnd,
} from "./slots";

const at = new Date("2026-09-21T00:00:00.000Z");

function running(position: number, over: Partial<LoopSlot> = {}): LoopSlot {
  return {
    position,
    state: "running",
    listingState: "approved",
    name: "TinyOrder",
    tagline: "Made for small businesses",
    logoUrl: null,
    url: "https://tinyorder.shop",
    ...over,
  };
}

describe("slot rules", () => {
  it("prices one term at the configured cents, as an amount", () => {
    expect(SLOT_PRICE).toBe(centsToAmount(economy.slot.priceUsdCents));
  });

  it("ends a term termDays after it starts", () => {
    expect(termEnd(at).getTime()).toBe(at.getTime() + economy.slot.termDays * DAY_MS);
  });

  it("holds a position only while booked or running", () => {
    expect(isLive("booked")).toBe(true);
    expect(isLive("running")).toBe(true);
    expect(isLive("ended")).toBe(false);
    expect(isLive("refunded")).toBe(false);
  });

  it("refunds a booked slot and nothing else", () => {
    expect(canRefund("booked")).toBe(true);
    expect(canRefund("running")).toBe(false);
    expect(canRefund("ended")).toBe(false);
    expect(canRefund("refunded")).toBe(false);
  });
});

describe("loopOf", () => {
  it("prints one band per position, open when nothing holds it", () => {
    const bands = loopOf([]);
    expect(bands).toHaveLength(economy.slot.count);
    expect(bands[0]).toEqual({ position: 1, kind: "open" });
    expect(bands[economy.slot.count - 1]).toEqual({ position: economy.slot.count, kind: "open" });
  });

  it("prints a running slot with an approved creative as a brand", () => {
    const bands = loopOf([running(3)]);
    expect(bands[2]).toEqual({
      position: 3,
      kind: "brand",
      name: "TinyOrder",
      tagline: "Made for small businesses",
      logoUrl: null,
      url: "https://tinyorder.shop",
    });
  });

  it("prints a booked slot as held", () => {
    const bands = loopOf([running(3, { state: "booked", listingState: "pending" })]);
    expect(bands[2]).toEqual({ position: 3, kind: "held" });
  });

  it("prints a running slot whose creative is not approved as held", () => {
    for (const listingState of ["pending", "rejected", "paused"] as const) {
      const bands = loopOf([running(3, { listingState })]);
      expect(bands[2]).toEqual({ position: 3, kind: "held" });
    }
    expect(loopOf([running(3, { listingState: null })])[2]).toEqual({ position: 3, kind: "held" });
  });

  it("ignores an ended or refunded slot", () => {
    const bands = loopOf([running(3, { state: "ended" }), running(4, { state: "refunded" })]);
    expect(bands[2]).toEqual({ position: 3, kind: "open" });
    expect(bands[3]).toEqual({ position: 4, kind: "open" });
  });

  it("prints an empty tagline for a brand with no creative copy", () => {
    const bands = loopOf([running(1, { tagline: null })]);
    expect(bands[0]).toMatchObject({ kind: "brand", tagline: "" });
  });
});

describe("availability", () => {
  it("counts live slots as taken", () => {
    const result = availability([
      { state: "booked" },
      { state: "running" },
      { state: "ended" },
      { state: "refunded" },
    ]);
    expect(result).toEqual({ total: economy.slot.count, taken: 2, left: economy.slot.count - 2 });
  });
});
