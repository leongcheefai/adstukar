import { describe, expect, it } from "vitest";
import { matchesExcludedTerm, rankCandidates, rollHouseAd } from "./ranking";

describe("matchesExcludedTerm", () => {
  it("matches case-insensitively across name and tagline", () => {
    expect(matchesExcludedTerm("CoinFlip", "Trade crypto fast", ["CRYPTO"])).toBe(true);
    expect(matchesExcludedTerm("CoinFlip", "Trade fast", ["crypto"])).toBe(false);
  });
  it("ignores blank phrases", () => {
    expect(matchesExcludedTerm("Any", "thing", ["", "  "])).toBe(false);
  });
});

describe("rankCandidates", () => {
  it("puts never-served first, then oldest served", () => {
    const ranked = rankCandidates([
      { id: "recent", lastServedAt: new Date("2026-08-31T10:00:00Z") },
      { id: "never", lastServedAt: null },
      { id: "old", lastServedAt: new Date("2026-08-01T10:00:00Z") },
    ]);
    expect(ranked.map((c) => c.id)).toEqual(["never", "old", "recent"]);
  });
  it("does not mutate the input", () => {
    const input = [{ lastServedAt: new Date() }, { lastServedAt: null }];
    const copy = [...input];
    rankCandidates(input);
    expect(input).toEqual(copy);
  });
});

describe("rollHouseAd", () => {
  it("is deterministic at the extremes", () => {
    expect(rollHouseAd(0, () => 0)).toBe(false);
    expect(rollHouseAd(100, () => 0.999)).toBe(true);
  });
  it("compares the roll against the percentage", () => {
    expect(rollHouseAd(30, () => 0.29)).toBe(true);
    expect(rollHouseAd(30, () => 0.31)).toBe(false);
  });
});
