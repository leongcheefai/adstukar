import { economy } from "@repo/config/economy";
import * as z from "zod/v4";

/**
 * A member names the amount in cents, never in a float dollar, so what Stripe
 * charges and what the ledger records are the same integer. The bounds are on
 * the schema, so a bad amount never reaches the service; the service checks
 * them again to name the reason.
 */
export const createTopupInput = z.object({
  usdCents: z.number().int().min(economy.topup.amount.minCents).max(economy.topup.amount.maxCents),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type CreateTopupInput = z.infer<typeof createTopupInput>;
