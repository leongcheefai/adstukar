import { payoutRequest } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

/**
 * One request to turn earned money into a payment. `ledgerEntryId` is here because
 * the entry it names is on the member's own ledger page: the request and the row
 * that took the amount are the same movement seen from two sides.
 */
export const payoutRequestContract = toWire(
  createSelectSchema(payoutRequest).pick({
    id: true,
    amount: true,
    usdCents: true,
    state: true,
    ledgerEntryId: true,
    reference: true,
    stripeTransferId: true,
    paidCents: true,
    paidCurrency: true,
    fxRate: true,
    fxRateDate: true,
    rejectionReason: true,
    reviewedAt: true,
    createdAt: true,
  }),
);

export type PayoutRequest = z.output<typeof payoutRequestContract>;
export type PayoutState = PayoutRequest["state"];
