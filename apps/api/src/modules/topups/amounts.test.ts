import { DAY_MS, economy } from "@repo/config/economy";
import { describe, expect, it } from "vitest";
import {
  refundAmount,
  refundBlock,
  refundDeadline,
  topupAmountBlock,
  unspentByTopup,
} from "./amounts";

const TOPUP = { amount: 10_000, usdCents: 1_000 };
const NOW = new Date("2026-06-01T00:00:00Z");

describe("topupAmountBlock", () => {
  const { minCents, maxCents } = economy.topup.amount;

  it("lets an amount inside the bounds through", () => {
    expect(topupAmountBlock(minCents)).toBeNull();
    expect(topupAmountBlock(maxCents)).toBeNull();
    expect(topupAmountBlock(1_234)).toBeNull();
  });

  it("refuses below the floor", () => {
    expect(topupAmountBlock(minCents - 1)).toBe("below-minimum");
    expect(topupAmountBlock(0)).toBe("below-minimum");
  });

  it("refuses above the ceiling", () => {
    expect(topupAmountBlock(maxCents + 1)).toBe("above-maximum");
  });
});

describe("refundDeadline", () => {
  it("runs the window from the payment", () => {
    const deadline = refundDeadline(NOW);
    expect(deadline.getTime()).toBe(NOW.getTime() + economy.topup.refundWindowDays * DAY_MS);
  });
});

describe("unspentByTopup", () => {
  const fresh = (amount: number, refunded = 0) => ({ amount, refunded });

  it("takes the spend off the oldest top-up first", () => {
    // Two top-ups of 10,000 and 12,000 units left: 8,000 were spent, and a spend
    // takes the oldest bought money. The list arrives oldest first.
    expect(unspentByTopup([fresh(10_000), fresh(10_000)], 12_000)).toEqual([2_000, 10_000]);
  });

  it("leaves nothing on an account that spent everything", () => {
    expect(unspentByTopup([fresh(10_000), fresh(10_000)], 0)).toEqual([0, 0]);
  });

  it("counts a refund against the top-up that gave it back, not against the oldest", () => {
    // The newer top-up already refunded 6,000. Of the 4,000 units that went, the
    // spend came out of the older one.
    expect(unspentByTopup([fresh(10_000), fresh(10_000, 6_000)], 10_000)).toEqual([6_000, 4_000]);
  });

  it("never gives a top-up more than it bought", () => {
    expect(unspentByTopup([fresh(10_000)], 25_000)).toEqual([10_000]);
  });

  it("treats a negative balance as nothing", () => {
    expect(unspentByTopup([fresh(10_000)], -500)).toEqual([0]);
  });

  it("holds nothing on a top-up that refunded in full", () => {
    expect(unspentByTopup([fresh(10_000, 10_000)], 0)).toEqual([0]);
  });
});

describe("refundAmount", () => {
  it("returns the whole top-up less the processor fee", () => {
    // $10 back: 290 basis points is 29 cents, plus the 30-cent fixed fee.
    expect(refundAmount(10_000, TOPUP)).toEqual({
      amount: 10_000,
      grossCents: 1_000,
      feeCents: 59,
      netCents: 941,
    });
  });

  it("charges the fixed fee only for the share it refunds", () => {
    // Half the top-up: 15 cents of the fixed fee, and 15 cents of the percentage.
    expect(refundAmount(5_000, TOPUP)).toEqual({
      amount: 5_000,
      grossCents: 500,
      feeCents: 30,
      netCents: 470,
    });
  });

  it("rounds the amount down to a whole cent and leaves the rest in the account", () => {
    const result = refundAmount(1_005, TOPUP);
    expect(result.grossCents).toBe(100);
    expect(result.amount).toBe(1_000);
  });

  it("never returns more money than it took", () => {
    const result = refundAmount(10, TOPUP);
    expect(result.netCents).toBe(0);
    expect(result.feeCents).toBeLessThanOrEqual(result.grossCents);
  });
});

describe("refundBlock", () => {
  const base = { state: "paid" as const, paidAt: NOW, refundable: 10_000, netCents: 941 };

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

  it("refuses one whose money is spent", () => {
    expect(refundBlock({ ...base, refundable: 0, netCents: 0, now: NOW })).toBe("nothing-left");
  });

  it("refuses one the processor fee would swallow", () => {
    expect(refundBlock({ ...base, refundable: 10, netCents: 0, now: NOW })).toBe("below-fee");
  });
});
