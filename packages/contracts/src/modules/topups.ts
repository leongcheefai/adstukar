import { TOPUP_REFUND_BLOCKS } from "@repo/db/enums";
import * as z from "zod/v4";
import { topupContract } from "../entities/topup";

/** One pack on the buy panel. The price follows the peg, so no pack carries a bonus. */
export const topupPackContract = z.object({
  points: z.number().int(),
  usdCents: z.number().int(),
});

/**
 * One past top-up and what it may still give back. The refundable points and the
 * money are worked out on the server, so the dashboard never repeats the fee
 * arithmetic, and `block` is the one reason a refund would be refused.
 */
export const topupHistoryItemContract = z.object({
  topup: topupContract,
  refundablePoints: z.number().int(),
  /** What the member would get back today, after the processor fee. */
  refundNetCents: z.number().int(),
  block: z.enum(TOPUP_REFUND_BLOCKS).nullable(),
});

export const topupOverviewOutput = z.object({
  packs: z.array(topupPackContract),
  refundWindowDays: z.number().int(),
  items: z.array(topupHistoryItemContract),
});

// Stripe's checkout session.url is string | null.
export const topupCheckoutOutput = z.object({ url: z.string().nullable() });

export const topupRefundOutput = topupContract;

export type TopupPack = z.output<typeof topupPackContract>;
export type TopupHistoryItem = z.output<typeof topupHistoryItemContract>;
export type TopupOverview = z.output<typeof topupOverviewOutput>;
export type TopupCheckoutResponse = z.output<typeof topupCheckoutOutput>;
export type TopupRefundBlock = NonNullable<TopupHistoryItem["block"]>;
