import { describe, expect, it } from "vitest";
import { amountToCents, centsToAmount, distributorKeeps, economy, rateTable } from "./economy";

describe("distributorKeeps", () => {
  it("is the amount less the fee, so the two sides of a play add up", () => {
    for (const amount of [3, 4, 6, 40, 160]) {
      expect(distributorKeeps(amount) + Math.floor((amount * economy.feePercent) / 100)).toBe(
        amount,
      );
    }
  });

  it("never rounds a unit away from the distributor", () => {
    // 30% of 3 is 0.9, and the fee rounds down, so the screen keeps all 3.
    expect(distributorKeeps(3)).toBe(3);
  });
});

describe("rateTable", () => {
  it("lists every tier in the order the config declares them", () => {
    expect(rateTable().map((row) => row.tier)).toEqual(Object.keys(economy.playRate));
  });

  it("matches the published table", () => {
    expect(rateTable()).toEqual([
      {
        tier: "standard",
        play: { lowest: 3, highest: 6 },
        playKeeps: { lowest: 3, highest: 5 },
        scan: 40,
        scanKeeps: 28,
      },
      {
        tier: "premium",
        play: { lowest: 6, highest: 12 },
        playKeeps: { lowest: 5, highest: 9 },
        scan: 80,
        scanKeeps: 56,
      },
      {
        tier: "flagship",
        play: { lowest: 12, highest: 24 },
        playKeeps: { lowest: 9, highest: 17 },
        scan: 160,
        scanKeeps: 112,
      },
    ]);
  });
});

describe("unit", () => {
  it("is one thousandth of a US dollar", () => {
    expect(economy.unit.perUsd).toBe(1000);
  });

  it("sells every pack at the peg", () => {
    for (const pack of economy.topup.packs) {
      expect(pack.amount).toBe(centsToAmount(pack.usdCents));
    }
  });
});

describe("amountToCents", () => {
  it("rounds down, so a part of a cent never becomes money", () => {
    expect(amountToCents(12_345)).toBe(1_234);
    expect(amountToCents(5)).toBe(0);
  });
});

describe("centsToAmount", () => {
  it("is exact at the peg", () => {
    expect(centsToAmount(1_000)).toBe(10_000);
  });
});
