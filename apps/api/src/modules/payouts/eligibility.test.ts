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

  it("never reports a debt, so a member is never asked to pay money back", () => {
    expect(withdrawable(1_000, -4_000)).toBe(0);
  });

  it("reports the whole matured balance when nothing was taken", () => {
    expect(withdrawable(20_000, 0)).toBe(20_000);
  });
});

describe("payoutBlock", () => {
  const enough = economy.payout.minimum;
  const ready = { hasStripeAccount: true, payoutsEnabled: true, hasOpenRequest: false };

  it("lets a member with a cleared Stripe account, no open request and enough money through", () => {
    expect(payoutBlock({ withdrawable: enough, ...ready })).toBeNull();
  });

  it("stops a second request while one is still open", () => {
    expect(payoutBlock({ withdrawable: enough, ...ready, hasOpenRequest: true })).toBe(
      "open-request",
    );
  });

  it("asks for a Stripe account before the first payout, not at signup", () => {
    expect(
      payoutBlock({
        withdrawable: enough,
        ...ready,
        hasStripeAccount: false,
        payoutsEnabled: false,
      }),
    ).toBe("stripe");
  });

  it("waits while Stripe has not cleared the account", () => {
    expect(payoutBlock({ withdrawable: enough, ...ready, payoutsEnabled: false })).toBe(
      "stripe-pending",
    );
  });

  it("rolls the remainder over below the threshold", () => {
    expect(payoutBlock({ withdrawable: enough - 1, ...ready })).toBe("below-minimum");
  });

  it("names the open request first, because it blocks whatever else is wrong", () => {
    expect(
      payoutBlock({
        withdrawable: 0,
        hasStripeAccount: false,
        payoutsEnabled: false,
        hasOpenRequest: true,
      }),
    ).toBe("open-request");
  });
});

describe("payoutAmount", () => {
  it("takes only what turns into whole cents, and rolls the rest over", () => {
    // 20,005 units is $20.005. Paying $20.00 and debiting all 20,005 would
    // destroy five units, so the five stay behind.
    expect(payoutAmount(20_005)).toEqual({ amount: 20_000, usdCents: 2_000 });
  });

  it("takes the whole balance when it already lands on a cent", () => {
    expect(payoutAmount(28_000)).toEqual({ amount: 28_000, usdCents: 2_800 });
  });

  it("takes nothing from a balance worth less than a cent", () => {
    expect(payoutAmount(5)).toEqual({ amount: 0, usdCents: 0 });
  });
});
