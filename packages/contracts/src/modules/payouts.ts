import { PAYOUT_BLOCKS } from "@repo/db/enums";
import * as z from "zod/v4";
import { payoutAccountContract } from "../entities/payout-account";
import { payoutRequestContract } from "../entities/payout-request";

/**
 * The cash-out panel. `block` is the one reason a request would be refused, so
 * the dashboard states it rather than guessing from the numbers.
 */
export const payoutOverviewOutput = z.object({
  account: payoutAccountContract.nullable(),
  /** Earned money that has served the hold, less what already left. */
  withdrawable: z.number().int(),
  minimum: z.number().int(),
  holdDays: z.number().int(),
  block: z.enum(PAYOUT_BLOCKS).nullable(),
  requests: z.array(payoutRequestContract),
});

export const savePayoutAccountOutput = payoutAccountContract;
export const payoutRequestOutput = payoutRequestContract;

export type PayoutOverview = z.output<typeof payoutOverviewOutput>;
export type PayoutBlock = NonNullable<PayoutOverview["block"]>;
