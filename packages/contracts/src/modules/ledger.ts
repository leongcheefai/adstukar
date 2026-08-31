import * as z from "zod/v4";
import { ledgerEntryContract } from "../entities/ledger-entry";

export const listLedgerOutput = z.object({
  items: z.array(ledgerEntryContract),
  nextCursor: z.string().nullable(),
});

export type ListLedgerResponse = z.output<typeof listLedgerOutput>;
