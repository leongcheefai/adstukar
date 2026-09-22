import type Stripe from "stripe";
import { describe, expect, it } from "vitest";
import { accountFlags, accountParams, connectEventChange } from "./connect";

const ACCOUNT = { details_submitted: true, payouts_enabled: false } as Stripe.Account;

describe("accountParams", () => {
  const params = accountParams({ country: "MY", email: "a@b.c", userId: "u1" });

  it("asks for card payments and transfers in every country, because the full dashboard refuses transfers alone", () => {
    for (const country of ["MY", "SG", "US"]) {
      expect(accountParams({ country, email: "a@b.c", userId: "u1" }).capabilities).toEqual({
        card_payments: { requested: true },
        transfers: { requested: true },
      });
    }
  });

  it("lets Stripe collect the identity and carry the losses, with the full dashboard, because a MY platform may not be loss-liable", () => {
    expect(params.controller).toEqual({
      fees: { payer: "account" },
      losses: { payments: "stripe" },
      stripe_dashboard: { type: "full" },
      requirement_collection: "stripe",
    });
  });

  it("carries the country, the email and the member id", () => {
    expect(params.country).toBe("MY");
    expect(params.email).toBe("a@b.c");
    expect(params.metadata).toEqual({ userId: "u1" });
  });
});

describe("accountFlags", () => {
  it("reads the two flags off the Stripe account", () => {
    expect(accountFlags(ACCOUNT)).toEqual({ detailsSubmitted: true, payoutsEnabled: false });
  });
});

describe("connectEventChange", () => {
  it("reads the account id and the flags off account.updated", () => {
    const event = {
      type: "account.updated",
      account: "acct_1",
      data: { object: { ...ACCOUNT, id: "acct_1", payouts_enabled: true } },
    } as unknown as Stripe.Event;
    expect(connectEventChange(event)).toEqual({
      stripeAccountId: "acct_1",
      flags: { detailsSubmitted: true, payoutsEnabled: true },
    });
  });

  it("falls back to the object id when the event carries no account", () => {
    const event = {
      type: "account.updated",
      data: { object: { ...ACCOUNT, id: "acct_2" } },
    } as unknown as Stripe.Event;
    expect(connectEventChange(event)?.stripeAccountId).toBe("acct_2");
  });

  it("ignores every other event", () => {
    const event = { type: "transfer.created", data: { object: {} } } as unknown as Stripe.Event;
    expect(connectEventChange(event)).toBeNull();
  });
});
