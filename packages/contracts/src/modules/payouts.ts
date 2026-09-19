import { PAYOUT_BLOCKS } from "@repo/db/enums";
import * as z from "zod/v4";
import { payoutRequestContract } from "../entities/payout-request";
import { stripeAccountContract } from "../entities/stripe-account";

/**
 * The cash-out panel. `block` is the one reason a request would be refused, so
 * the dashboard states it rather than guessing from the numbers.
 */
export const payoutOverviewOutput = z.object({
  stripeAccount: stripeAccountContract.nullable(),
  /** Earned money that has served the hold, less what already left. */
  withdrawable: z.number().int(),
  minimum: z.number().int(),
  holdDays: z.number().int(),
  block: z.enum(PAYOUT_BLOCKS).nullable(),
  requests: z.array(payoutRequestContract),
});

/** Where the browser goes next: a Stripe-hosted onboarding page. */
export const connectStripeOutput = z.object({
  url: z.string().url(),
});

export const stripeAccountOutput = stripeAccountContract;
export const payoutRequestOutput = payoutRequestContract;

export type PayoutOverview = z.output<typeof payoutOverviewOutput>;
export type PayoutBlock = NonNullable<PayoutOverview["block"]>;
export type ConnectStripeResponse = z.output<typeof connectStripeOutput>;
