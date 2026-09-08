import { PAYOUT_METHODS } from "@repo/db/enums";
import * as z from "zod/v4";

/**
 * Identity on file. A member fills this in the day they cash out, not at signup,
 * so nothing here blocks a distributor from earning first.
 */
export const savePayoutAccountInput = z.object({
  legalName: z.string().trim().min(1).max(120),
  /** ISO 3166-1 alpha-2, upper case. It decides which rails an admin can use. */
  country: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/, "Use a two-letter country code"),
  method: z.enum(PAYOUT_METHODS),
  /** An account number, an IBAN, or a PayPal address. A person reads it. */
  destination: z.string().trim().min(1).max(200),
});

/** What the admin typed after sending the money, so the payment can be traced. */
export const payPayoutInput = z.object({
  reference: z.string().trim().min(1).max(200),
});

export type SavePayoutAccountInput = z.infer<typeof savePayoutAccountInput>;
export type PayPayoutInput = z.infer<typeof payPayoutInput>;
