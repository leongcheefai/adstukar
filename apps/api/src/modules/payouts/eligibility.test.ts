import { economy } from "@repo/config/economy";
import { describe, expect, it } from "vitest";
import { holdCutoff, payoutAmount, payoutBlock, withdrawable } from "./eligibility";

describe("holdCutoff", () => {
  it("goes back the hold from now", () => {
    const now = new Date("2026-03-31T00:00:00Z");
    const cutoff = holdCutoff(now);
    const days = (now.getTime() - cutoff.getTime()) / 86_400_000;
    expect(days).toBe(economy.payout.holdDays);
  });
});

describe("withdrawable", () => {
  it("takes every debit off the matured credits", () => {
    expect(withdrawable(30_000, -9_000)).toBe(21_000);
  });

  it("counts nothing while no credit has served the hold", () => {
    expect(withdrawable(0, -9_000)).toBe(0);
  });

  it("never reports a debt, so a member is never asked to pay points back", () => {
    expect(withdrawable(1_000, -4_000)).toBe(0);
  });

  it("reports the whole matured balance when nothing was taken", () => {
    expect(withdrawable(20_000, 0)).toBe(20_000);
  });
});

describe("payoutBlock", () => {
  const enough = economy.payout.minimumPoints;

  it("lets a member with identity, no open request and enough points through", () => {
    expect(
      payoutBlock({ withdrawable: enough, hasAccount: true, hasOpenRequest: false }),
    ).toBeNull();
  });

  it("stops a second request while one is still open", () => {
    expect(payoutBlock({ withdrawable: enough, hasAccount: true, hasOpenRequest: true })).toBe(
      "open-request",
    );
  });

  it("asks for identity before the first payout, not at signup", () => {
    expect(payoutBlock({ withdrawable: enough, hasAccount: false, hasOpenRequest: false })).toBe(
      "identity",
    );
  });

  it("rolls points over below the threshold", () => {
    expect(payoutBlock({ withdrawable: enough - 1, hasAccount: true, hasOpenRequest: false })).toBe(
      "below-minimum",
    );
  });

  it("names the open request first, because it blocks whatever else is wrong", () => {
    expect(payoutBlock({ withdrawable: 0, hasAccount: false, hasOpenRequest: true })).toBe(
      "open-request",
    );
  });
});

describe("payoutAmount", () => {
  it("takes only what turns into whole cents, and rolls the rest over", () => {
    // 20,005 points is $20.005. Paying $20.00 and debiting all 20,005 would
    // destroy five points, so the five stay behind.
    expect(payoutAmount(20_005)).toEqual({ points: 20_000, usdCents: 2_000 });
  });

  it("takes the whole balance when it already lands on a cent", () => {
    expect(payoutAmount(28_000)).toEqual({ points: 28_000, usdCents: 2_800 });
  });

  it("takes nothing from a balance worth less than a cent", () => {
    expect(payoutAmount(5)).toEqual({ points: 0, usdCents: 0 });
  });
});
