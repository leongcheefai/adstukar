import { DAY_MS, economy } from "@repo/config/economy";
import { describe, expect, it } from "vitest";
import { findPack, refundAmount, refundBlock, refundDeadline, unspentByTopup } from "./packs";

const PACK = { points: 10_000, usdCents: 1_000 };
const NOW = new Date("2026-06-01T00:00:00Z");

describe("findPack", () => {
  it("returns the pack an advertiser asked for", () => {
    expect(findPack(10_000)).toEqual({ points: 10_000, usdCents: 1_000 });
    expect(findPack(250_000)).toEqual({ points: 250_000, usdCents: 25_000 });
  });

  it("refuses an amount we do not sell", () => {
    expect(findPack(12_345)).toBeNull();
    expect(findPack(0)).toBeNull();
  });

  it("prices every pack at the peg, with no bonus", () => {
    for (const pack of economy.topup.packs) {
      expect(pack.points).toBe((pack.usdCents * economy.pointsPerUsd) / 100);
    }
  });
});

describe("refundDeadline", () => {
  it("runs the window from the payment", () => {
    const deadline = refundDeadline(NOW);
    expect(deadline.getTime()).toBe(NOW.getTime() + economy.topup.refundWindowDays * DAY_MS);
  });
});

describe("unspentByTopup", () => {
  const fresh = (points: number, refunded = 0) => ({ points, refunded });

  it("takes the spend off the oldest top-up first", () => {
    // Two packs of 10,000 and 12,000 points left: 8,000 were spent, and a spend
    // takes the oldest bought points. The list arrives oldest first.
    expect(unspentByTopup([fresh(10_000), fresh(10_000)], 12_000)).toEqual([2_000, 10_000]);
  });

  it("leaves nothing on an account that spent everything", () => {
    expect(unspentByTopup([fresh(10_000), fresh(10_000)], 0)).toEqual([0, 0]);
  });

  it("counts a refund against the top-up that gave it back, not against the oldest", () => {
    // The newer pack already refunded 6,000. Of the 4,000 points that went, the
    // spend came out of the older pack.
    expect(unspentByTopup([fresh(10_000), fresh(10_000, 6_000)], 10_000)).toEqual([6_000, 4_000]);
  });

  it("never gives a top-up more than it bought", () => {
    expect(unspentByTopup([fresh(10_000)], 25_000)).toEqual([10_000]);
  });

  it("treats a negative balance as nothing", () => {
    expect(unspentByTopup([fresh(10_000)], -500)).toEqual([0]);
  });

  it("holds no points on a top-up that refunded in full", () => {
    expect(unspentByTopup([fresh(10_000, 10_000)], 0)).toEqual([0]);
  });
});

describe("refundAmount", () => {
  it("returns the whole pack less the processor fee", () => {
    // $10 back: 290 basis points is 29 cents, plus the 30-cent fixed fee.
    expect(refundAmount(10_000, PACK)).toEqual({
      points: 10_000,
      grossCents: 1_000,
      feeCents: 59,
      netCents: 941,
    });
  });

  it("charges the fixed fee only for the share it refunds", () => {
    // Half the pack: 15 cents of the fixed fee, and 15 cents of the percentage.
    expect(refundAmount(5_000, PACK)).toEqual({
      points: 5_000,
      grossCents: 500,
      feeCents: 30,
      netCents: 470,
    });
  });

  it("rounds the points down to a whole cent and leaves the rest in the account", () => {
    const result = refundAmount(1_005, PACK);
    expect(result.grossCents).toBe(100);
    expect(result.points).toBe(1_000);
  });

  it("never returns more money than it took", () => {
    const result = refundAmount(10, PACK);
    expect(result.netCents).toBe(0);
    expect(result.feeCents).toBeLessThanOrEqual(result.grossCents);
  });
});

describe("refundBlock", () => {
  const base = { state: "paid" as const, paidAt: NOW, refundablePoints: 10_000, netCents: 941 };

  it("lets a fresh, unspent top-up through", () => {
    expect(refundBlock({ ...base, now: NOW })).toBeNull();
  });

  it("refuses a top-up that never took the money", () => {
    expect(refundBlock({ ...base, state: "pending", paidAt: null, now: NOW })).toBe("not-paid");
  });

  it("refuses a top-up that already refunded", () => {
    expect(refundBlock({ ...base, state: "refunded", now: NOW })).toBe("not-paid");
  });

  it("refuses one past the window", () => {
    const late = new Date(NOW.getTime() + (economy.topup.refundWindowDays + 1) * DAY_MS);
    expect(refundBlock({ ...base, now: late })).toBe("window-closed");
  });

  it("refuses one whose points are spent", () => {
    expect(refundBlock({ ...base, refundablePoints: 0, netCents: 0, now: NOW })).toBe(
      "nothing-left",
    );
  });

  it("refuses one the processor fee would swallow", () => {
    expect(refundBlock({ ...base, refundablePoints: 10, netCents: 0, now: NOW })).toBe("below-fee");
  });
});
