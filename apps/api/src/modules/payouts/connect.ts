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
 * A connected account that only receives, in the one shape a Malaysia platform
 * may create: Stripe collects the identity, Stripe carries the losses, the
 * member pays their own Stripe fees, and the member gets the full Stripe
 * dashboard. Stripe refuses every shape where the platform is liable for
 * losses to a platform in MY, and Express, the recipient agreement and the v2
 * recipient account all need that (docs/adr/0011).
 *
 * With the full dashboard, Stripe refuses `transfers` alone, so the account
 * asks for `card_payments` too, in every country. It never charges a card.
 */
export function accountParams(input: {
  country: string;
  email: string;
  userId: string;
}): Stripe.AccountCreateParams {
  return {
    country: input.country,
    email: input.email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    controller: {
      fees: { payer: "account" },
      losses: { payments: "stripe" },
      stripe_dashboard: { type: "full" },
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
