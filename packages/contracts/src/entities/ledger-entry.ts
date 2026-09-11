import { ledgerEntry } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

// Excludes userId (implied by the session) and idempotencyKey (internal).
export const ledgerEntryContract = toWire(
  createSelectSchema(ledgerEntry).pick({
    id: true,
    delta: true,
    state: true,
    reason: true,
    lot: true,
    playId: true,
    relatedEntryId: true,
    createdAt: true,
    settlesAt: true,
    settledAt: true,
  }),
);

export type LedgerEntry = z.output<typeof ledgerEntryContract>;
export type LedgerState = LedgerEntry["state"];
export type LedgerReason = LedgerEntry["reason"];
export type LedgerLot = LedgerEntry["lot"];
