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

/**
 * A campaign runs or it does not. An admin never moves a campaign; the domain
 * check gates it, and moderation acts on the listings under it.
 */
export const CAMPAIGN_STATES = ["draft", "active", "paused", "archived"] as const;

/**
 * Why the system paused a campaign. A campaign a person paused carries no
 * reason, and only that person starts it again.
 *
 * `budget` lifts on the next UTC day, because the daily budget resets then.
 * `balance` lifts as soon as the owner's purse covers one play.
 */
export const CAMPAIGN_PAUSE_REASONS = ["budget", "balance"] as const;

export type CampaignPauseReason = (typeof CAMPAIGN_PAUSE_REASONS)[number];

/**
 * An admin reviews every listing. `paused` is the advertiser's own stop: the
 * creative keeps its approval and simply stops playing, so starting it again
 * needs no second review.
 */
export const LISTING_STATES = ["pending", "approved", "rejected", "paused", "archived"] as const;

/**
 * The states an advertiser owns. A person reviews the creative, so `pending`,
 * `rejected` and `archived` are never the advertiser's to set.
 */
export const OWNER_LISTING_STATES = ["approved", "paused"] as const;

export type ListingState = (typeof LISTING_STATES)[number];
export type OwnerListingState = (typeof OWNER_LISTING_STATES)[number];

/** An admin reviews every device, and stamps the tier at approval. */
export const DEVICE_STATES = ["pending", "approved", "rejected", "archived"] as const;

/** The quality class an admin stamps on a device. The tier sets the rate. */
export const DEVICE_TIERS = ["standard", "premium", "flagship"] as const;

export const VENUE_TYPES = [
  "cafe",
  "restaurant",
  "salon",
  "gym",
  "clinic",
  "retail",
  "office",
  "other",
] as const;

/** The overlay region a placement draws on the device. */
export const PLACEMENT_FORMATS = ["band", "float", "ticker"] as const;

/** How much of the screen the region takes. */
export const PLACEMENT_SIZES = ["small", "medium", "large"] as const;

/**
 * A play opens when CapyTV takes a listing, and counts when the device reports
 * the full dwell. It voids when the report never arrives.
 */
export const PLAY_STATES = ["open", "counted", "void"] as const;

export const LEDGER_STATES = ["pending", "settled", "void"] as const;

export const LEDGER_REASONS = [
  "earn",
  "spend",
  "fee",
  "grant",
  "topup",
  "payout",
  "refund",
  "expiry",
  "void",
] as const;

/**
 * The origin of a point. The lot decides the rules, not the label:
 * `bought` refunds and never expires, `earned` withdraws after the hold and
 * expires, `granted` neither refunds nor withdraws, and expires.
 */
export const LEDGER_LOTS = ["bought", "earned", "granted"] as const;
