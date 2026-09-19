import { economy } from "@repo/config/economy";
import * as z from "zod/v4";

/**
 * The first press of "Connect Stripe". The country is fixed on the Stripe
 * account at creation, so it is named here and never changed. The two URLs are
 * where Stripe sends the member back: `returnUrl` when the form is done,
 * `refreshUrl` when the link expired.
 */
export const connectStripeInput = z.object({
  country: z.enum(economy.payout.countries),
  returnUrl: z.string().url(),
  refreshUrl: z.string().url(),
});

export type ConnectStripeInput = z.infer<typeof connectStripeInput>;
