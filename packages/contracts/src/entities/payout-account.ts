import { payoutAccount } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

/**
 * Where a distributor's money goes.
 *
 * `destination` is an account number or a PayPal address, so this shape belongs
 * to the member who owns it and to the admin who pays it, and to nobody else.
 * `userId` stays out: the session implies it on the member route, and the admin
 * queue carries the owner beside the account.
 */
export const payoutAccountContract = toWire(
  createSelectSchema(payoutAccount).pick({
    id: true,
    legalName: true,
    country: true,
    method: true,
    destination: true,
    createdAt: true,
    updatedAt: true,
  }),
);

export type PayoutAccount = z.output<typeof payoutAccountContract>;
export type PayoutMethod = PayoutAccount["method"];
