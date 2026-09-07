import { describe, expect, it } from "vitest";
import { matchesExcludedTerm, nextPlacement, rankCandidates } from "./ranking";

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
  it("puts never-played first, then oldest played", () => {
    const ranked = rankCandidates([
      { id: "recent", lastPlayedAt: new Date("2026-08-31T10:00:00Z") },
      { id: "never", lastPlayedAt: null },
      { id: "old", lastPlayedAt: new Date("2026-08-01T10:00:00Z") },
    ]);
    expect(ranked.map((c) => c.id)).toEqual(["never", "old", "recent"]);
  });
  it("does not mutate the input", () => {
    const input = [{ lastPlayedAt: new Date() }, { lastPlayedAt: null }];
    const copy = [...input];
    rankCandidates(input);
    expect(input).toEqual(copy);
  });
});

describe("nextPlacement", () => {
  it("takes the region that has waited longest", () => {
    const picked = nextPlacement([
      { id: "band", lastPlayedAt: new Date("2026-08-31T10:00:00Z") },
      { id: "ticker", lastPlayedAt: new Date("2026-08-01T10:00:00Z") },
    ]);
    expect(picked?.id).toBe("ticker");
  });
  it("returns null when the device holds no placement", () => {
    expect(nextPlacement([])).toBeNull();
  });
});
