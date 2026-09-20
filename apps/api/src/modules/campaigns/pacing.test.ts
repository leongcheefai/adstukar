import { describe, expect, it } from "vitest";
import {
  cheapestPlay,
  listingBudgets,
  outOfBudget,
  outOfFunds,
  readyToResume,
  shareByListing,
  splitBudget,
  startOfUtcDay,
} from "./pacing";

describe("splitBudget", () => {
  it("splits evenly when the budget divides", () => {
    expect(splitBudget(20_000, 4)).toEqual([5_000, 5_000, 5_000, 5_000]);
  });

  it("gives the remainder to the first listings, so the shares add up", () => {
    const shares = splitBudget(10, 4);
    expect(shares).toEqual([3, 3, 2, 2]);
    expect(shares.reduce((sum, n) => sum + n, 0)).toBe(10);
  });

  it("gives one listing the whole budget", () => {
    expect(splitBudget(1_000, 1)).toEqual([1_000]);
  });

  it("splits nothing over no listings", () => {
    expect(splitBudget(1_000, 0)).toEqual([]);
  });
});

describe("listingBudgets", () => {
  it("keys the shares by listing", () => {
    const shares = listingBudgets(9, ["a", "b", "c"]);
    expect(shares.get("a")).toBe(3);
    expect(shares.get("c")).toBe(3);
  });

  it("hands the same listing the same share whatever order it arrives in", () => {
    const one = listingBudgets(10, ["b", "a", "c"]);
    const other = listingBudgets(10, ["c", "b", "a"]);
    expect(one).toEqual(other);
  });
});

describe("shareByListing", () => {
  const lone = { listingId: "b1", campaignId: "b", dailyBudget: 3_000 };
  const rows = [
    { listingId: "a1", campaignId: "a", dailyBudget: 20_000 },
    { listingId: "a2", campaignId: "a", dailyBudget: 20_000 },
    lone,
  ];

  it("splits each campaign over its own listings", () => {
    const shares = shareByListing(rows);
    expect(shares.get("a1")).toBe(10_000);
    expect(shares.get("a2")).toBe(10_000);
    expect(shares.get("b1")).toBe(3_000);
  });

  it("gives one listing the whole campaign budget", () => {
    expect(shareByListing([lone]).get("b1")).toBe(3_000);
  });

  it("splits nothing when no listing may run", () => {
    expect(shareByListing([]).size).toBe(0);
  });
});

describe("outOfBudget", () => {
  it("says no while the budget can still buy the cheapest play", () => {
    expect(outOfBudget(0, 1_000)).toBe(false);
    expect(outOfBudget(1_000 - cheapestPlay(), 1_000)).toBe(false);
  });

  it("says yes once what is left cannot buy anything", () => {
    expect(outOfBudget(1_000, 1_000)).toBe(true);
    expect(outOfBudget(1_000 - cheapestPlay() + 1, 1_000)).toBe(true);
  });

  it("says yes when the spend somehow ran past the budget", () => {
    expect(outOfBudget(1_200, 1_000)).toBe(true);
  });
});

describe("outOfFunds", () => {
  it("says yes on an empty purse", () => {
    expect(outOfFunds(0)).toBe(true);
  });

  it("says yes on a purse that holds less than one play", () => {
    expect(outOfFunds(cheapestPlay() - 1)).toBe(true);
  });

  it("says no once the purse covers one play", () => {
    expect(outOfFunds(cheapestPlay())).toBe(false);
  });
});

describe("readyToResume", () => {
  const now = new Date("2026-03-04T09:00:00Z");

  it("resumes a budget pause on the next day", () => {
    const pausedAt = new Date("2026-03-03T22:00:00Z");
    expect(readyToResume({ reason: "budget", pausedAt, spendable: 10_000, now })).toBe(true);
  });

  it("holds a budget pause for the rest of the same day", () => {
    const pausedAt = new Date("2026-03-04T01:00:00Z");
    expect(readyToResume({ reason: "budget", pausedAt, spendable: 10_000, now })).toBe(false);
  });

  it("holds a budget pause while the purse is empty, because it would stop again", () => {
    const pausedAt = new Date("2026-03-03T22:00:00Z");
    expect(readyToResume({ reason: "budget", pausedAt, spendable: 0, now })).toBe(false);
  });

  it("resumes a balance pause as soon as the purse covers one play", () => {
    const pausedAt = new Date("2026-03-04T01:00:00Z");
    expect(readyToResume({ reason: "balance", pausedAt, spendable: cheapestPlay(), now })).toBe(
      true,
    );
  });

  it("holds a balance pause while the purse stays empty", () => {
    const pausedAt = new Date("2026-01-01T00:00:00Z");
    expect(readyToResume({ reason: "balance", pausedAt, spendable: 0, now })).toBe(false);
  });

  it("never resumes a campaign a person paused", () => {
    expect(readyToResume({ reason: null, pausedAt: null, spendable: 10_000, now })).toBe(false);
  });
});

describe("startOfUtcDay", () => {
  it("drops the time and keeps the UTC date", () => {
    expect(startOfUtcDay(new Date("2026-03-04T23:59:59Z")).toISOString()).toBe(
      "2026-03-04T00:00:00.000Z",
    );
  });
});
