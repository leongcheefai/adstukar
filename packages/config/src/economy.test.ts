import { describe, expect, it } from "vitest";
import { amountToCents, centsToAmount, earnPerPlay, economy } from "./economy";

describe("earnPerPlay", () => {
  it("is the published rate: 2 units, $2.00 per 1,000 plays, for every screen", () => {
    expect(earnPerPlay()).toBe(2);
    expect(economy.earn.perThousandPlays).toBe(2_000);
  });

  it("is a whole number of units, so the ledger stays integer", () => {
    expect(Number.isInteger(earnPerPlay())).toBe(true);
  });
});

describe("unit", () => {
  it("is one thousandth of a US dollar", () => {
    expect(economy.unit.perUsd).toBe(1000);
  });

  it("bounds a top-up and lists presets inside the bounds", () => {
    const { minCents, maxCents, presetsCents } = economy.topup.amount;
    expect(minCents).toBeLessThan(maxCents);
    for (const preset of presetsCents) {
      expect(preset).toBeGreaterThanOrEqual(minCents);
      expect(preset).toBeLessThanOrEqual(maxCents);
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

describe("payout", () => {
  it("takes at least ten dollars", () => {
    expect(economy.payout.minimum).toBe(10_000);
  });

  it("names every country a connected account may live in, upper case", () => {
    expect(economy.payout.countries.length).toBeGreaterThan(0);
    for (const country of economy.payout.countries) expect(country).toMatch(/^[A-Z]{2}$/);
  });

  it("offers Malaysia first, because the platform lives there", () => {
    expect(economy.payout.countries[0]).toBe("MY");
  });

  it("pays in MYR, inside a rate band that holds the real ringgit", () => {
    expect(economy.payout.paidIn.currency).toBe("MYR");
    const { min, max } = economy.payout.paidIn.rateBounds;
    expect(min).toBeLessThan(4);
    expect(max).toBeGreaterThan(4.5);
  });
});
