import { DAY_MS, amountToCents, centsToAmount, economy } from "@repo/config/economy";
import type { PayoutBlock } from "@repo/db/enums";

/**
 * The rules that decide whether earned money may leave as a payment. They are pure,
 * so the amounts and the refusals can be read without a database.
 *
 * Only the `earned` lot ever withdraws. `bought` refunds and `granted` does
 * neither, so free money can never become a cash faucet (docs/adr/0001).
 */

/**
 * The moment an earn must have settled before, to have served the hold. The hold
 * is the window in which a dead screen is caught before cash leaves.
 */
export function holdCutoff(now: Date): Date {
  return new Date(now.getTime() - economy.payout.holdDays * DAY_MS);
}

/**
 * What a member may take out: the earned credits that have served the hold, less
 * every debit already on that lot.
 *
 * A debit counts whatever its age, and a credit only once it has matured. The
 * asymmetry is deliberate: an open payout debits the lot today, and waiting out
 * a second hold before it counted would let one balance answer two requests.
 *
 * @param matured Earned credits settled before the hold cutoff. Positive.
 * @param debits Every debit on the earned lot — fee, payout, expiry. Negative.
 */
export function withdrawable(matured: number, debits: number): number {
  return Math.max(0, matured + debits);
}

/**
 * The one reason a request is refused, or null when it may go ahead. The open
 * request comes first: while one is under review, nothing else about the account
 * changes the answer. Then the Stripe account, in two steps: it must exist, and
 * Stripe must have cleared it to receive money.
 */
export function payoutBlock(input: {
  withdrawable: number;
  hasStripeAccount: boolean;
  payoutsEnabled: boolean;
  hasOpenRequest: boolean;
}): PayoutBlock | null {
  if (input.hasOpenRequest) return "open-request";
  if (!input.hasStripeAccount) return "stripe";
  if (!input.payoutsEnabled) return "stripe-pending";
  if (input.withdrawable < economy.payout.minimum) return "below-minimum";
  return null;
}

/**
 * What one payout actually takes, and what it pays.
 *
 * A balance rarely lands on a whole cent. Debiting all of it and paying the
 * rounded-down money would destroy the difference, so the payout takes only the
 * amount the money covers and the remainder rolls over to the next one.
 */
export function payoutAmount(withdrawable: number): { amount: number; usdCents: number } {
  const usdCents = amountToCents(withdrawable);
  return { amount: centsToAmount(usdCents), usdCents };
}
