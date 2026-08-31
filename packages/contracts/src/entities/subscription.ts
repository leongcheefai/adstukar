import { subscription } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

// Excludes userId, stripeCustomerId, stripeSubscriptionId, createdAt, updatedAt.
// The Stripe identifiers were previously shipped to the browser by billing.routes.ts
// returning the raw row; they are internal and must not be on the wire.
export const subscriptionContract = toWire(
  createSelectSchema(subscription).pick({
    id: true,
    status: true,
    stripePriceId: true,
    stripeCurrentPeriodEnd: true,
    cancelAtPeriodEnd: true,
  }),
);

export type Subscription = z.output<typeof subscriptionContract>;
export type SubscriptionStatus = NonNullable<Subscription["status"]>;
