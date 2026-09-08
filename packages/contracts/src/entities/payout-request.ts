import { payoutRequest } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

/**
 * One request to turn earned points into money. `ledgerEntryId` is here because
 * the entry it names is on the member's own ledger page: the request and the row
 * that took the points are the same movement seen from two sides.
 */
export const payoutRequestContract = toWire(
  createSelectSchema(payoutRequest).pick({
    id: true,
    points: true,
    usdCents: true,
    state: true,
    ledgerEntryId: true,
    reference: true,
    rejectionReason: true,
    reviewedAt: true,
    createdAt: true,
  }),
);

export type PayoutRequest = z.output<typeof payoutRequestContract>;
export type PayoutState = PayoutRequest["state"];
