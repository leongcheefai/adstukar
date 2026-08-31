// Plain tuples with no drizzle import: pgEnum builds from these, and so does zod
// in @repo/contracts. Anything importing these stays free of drizzle-orm/pg-core.

export const FEEDBACK_TYPES = ["bug", "feature", "other"] as const;

export const SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "unpaid",
  "paused",
] as const;

export const PRODUCT_STATUSES = ["pending", "approved", "rejected"] as const;

export const PLACEMENT_SIZES = ["small", "medium"] as const;

export const LEDGER_STATES = ["pending", "settled", "void"] as const;

export const LEDGER_REASONS = ["earn", "spend", "grant", "expiry", "void"] as const;
