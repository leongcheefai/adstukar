import { stripeAccount } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

/**
 * The Stripe account a distributor is paid to, as the dashboard and the admin
 * queue read it. `stripeAccountId` stays off the wire: only the API ever pays,
 * so nobody outside it needs the id. `userId` stays out for the same reason as
 * every other member entity: the session implies it.
 */
export const stripeAccountContract = toWire(
  createSelectSchema(stripeAccount).pick({
    id: true,
    country: true,
    detailsSubmitted: true,
    payoutsEnabled: true,
    createdAt: true,
    updatedAt: true,
  }),
);

export type StripeAccount = z.output<typeof stripeAccountContract>;
