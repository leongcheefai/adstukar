import { LEDGER_LOTS, LEDGER_REASONS, LEDGER_STATES } from "@repo/db/enums";
import * as z from "zod/v4";

export const listLedgerQuery = z.object({
  reason: z.enum(LEDGER_REASONS).optional(),
  state: z.enum(LEDGER_STATES).optional(),
  lot: z.enum(LEDGER_LOTS).optional(),
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export type ListLedgerQuery = z.infer<typeof listLedgerQuery>;
