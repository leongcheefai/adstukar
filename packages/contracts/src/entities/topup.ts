import { topup } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

/**
 * One purchase of points with money, as the advertiser sees it. The Stripe
 * session, payment and refund ids stay off the wire: they name a payment the
 * browser never has to address, and the ledger entries already trace the
 * movement from the member's own page.
 */
export const topupContract = toWire(
  createSelectSchema(topup).pick({
    id: true,
    points: true,
    usdCents: true,
    state: true,
    ledgerEntryId: true,
    refundedPoints: true,
    refundUsdCents: true,
    refundLedgerEntryId: true,
    createdAt: true,
    paidAt: true,
    refundedAt: true,
  }),
);

export type Topup = z.output<typeof topupContract>;
export type TopupState = Topup["state"];
