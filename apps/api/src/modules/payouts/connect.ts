import type Stripe from "stripe";

/**
 * The pure side of Stripe Connect: what CapyAds asks Stripe for, and what it
 * reads back. Nothing here talks to Stripe or to the database, so the shapes
 * are tested without either.
 */

/** What the row keeps of a Stripe account. */
export interface AccountFlags {
  detailsSubmitted: boolean;
  payoutsEnabled: boolean;
}

/**
 * A connected account that only receives. Stripe collects the identity, pays
 * the losses, and gives the member the Express dashboard. CapyAds pays the
 * Stripe fees, because the distributor never chose Stripe.
 */
export function accountParams(input: {
  country: string;
  email: string;
  userId: string;
}): Stripe.AccountCreateParams {
  return {
    country: input.country,
    email: input.email,
    capabilities: { transfers: { requested: true } },
    controller: {
      fees: { payer: "application" },
      losses: { payments: "application" },
      stripe_dashboard: { type: "express" },
      requirement_collection: "stripe",
    },
    metadata: { userId: input.userId },
  };
}

/** The two flags the row keeps, read off a Stripe account. */
export function accountFlags(
  account: Pick<Stripe.Account, "details_submitted" | "payouts_enabled">,
): AccountFlags {
  return {
    detailsSubmitted: account.details_submitted,
    payoutsEnabled: account.payouts_enabled,
  };
}

/**
 * What one Connect event changes on a row, or null when it changes nothing.
 * Only `account.updated` matters. `event.account` names the connected account;
 * the object's own id is the same thing when the field is absent.
 */
export function connectEventChange(
  event: Stripe.Event,
): { stripeAccountId: string; flags: AccountFlags } | null {
  if (event.type !== "account.updated") return null;
  const account = event.data.object;
  return { stripeAccountId: event.account ?? account.id, flags: accountFlags(account) };
}
