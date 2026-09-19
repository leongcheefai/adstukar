import * as z from "zod/v4";

/**
 * A member names the amount in cents, never in a float dollar, so what Stripe
 * charges and what the ledger records are the same integer. The server checks
 * the bounds.
 */
export const createTopupInput = z.object({
  usdCents: z.number().int().positive(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type CreateTopupInput = z.infer<typeof createTopupInput>;
