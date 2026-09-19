import { TOPUP_REFUND_BLOCKS } from "@repo/db/enums";
import * as z from "zod/v4";
import { topupContract } from "../entities/topup";

/** What a top-up may be: the bounds in cents, and the presets the panel offers. */
export const topupAmountRuleContract = z.object({
  minCents: z.number().int(),
  maxCents: z.number().int(),
  presetsCents: z.array(z.number().int()),
});

/**
 * One past top-up and what it may still give back. The refundable amount and the
 * money are worked out on the server, so the dashboard never repeats the fee
 * arithmetic, and `block` is the one reason a refund would be refused.
 */
export const topupHistoryItemContract = z.object({
  topup: topupContract,
  refundable: z.number().int(),
  /** What the member would get back today, after the processor fee. */
  refundNetCents: z.number().int(),
  block: z.enum(TOPUP_REFUND_BLOCKS).nullable(),
});

export const topupOverviewOutput = z.object({
  amount: topupAmountRuleContract,
  refundWindowDays: z.number().int(),
  items: z.array(topupHistoryItemContract),
});

// Stripe's checkout session.url is string | null.
export const topupCheckoutOutput = z.object({ url: z.string().nullable() });

export type TopupAmountRule = z.output<typeof topupAmountRuleContract>;
export type TopupHistoryItem = z.output<typeof topupHistoryItemContract>;
export type TopupOverview = z.output<typeof topupOverviewOutput>;
export type TopupCheckoutResponse = z.output<typeof topupCheckoutOutput>;
export type TopupRefundBlock = NonNullable<TopupHistoryItem["block"]>;
