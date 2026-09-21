// Plain tuples with no drizzle import: pgEnum builds from these, and so does zod
// in @repo/contracts. Anything importing these stays free of drizzle-orm/pg-core.

export const FEEDBACK_TYPES = ["bug", "feature", "other"] as const;

/**
 * A campaign runs or it does not. An admin never moves a campaign; the domain
 * check gates it, and moderation acts on the listings under it.
 */
export const CAMPAIGN_STATES = ["draft", "active", "paused", "archived"] as const;

export type CampaignState = (typeof CAMPAIGN_STATES)[number];

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
 * The origin of an amount. The lot decides the rules, not the label:
 * `bought` refunds and never expires, `earned` withdraws after the hold and
 * expires, `granted` neither refunds nor withdraws, and expires.
 */
export const LEDGER_LOTS = ["bought", "earned", "granted"] as const;

/**
 * A payout is requested by the distributor, and an admin then pays it or refuses
 * it. There is no `approved` step: the MVP pays by hand in one admin session, so
 * approval and payment are the same act (docs/adr/0005).
 */
export const PAYOUT_STATES = ["requested", "paid", "rejected"] as const;

export type PayoutState = (typeof PAYOUT_STATES)[number];

/**
 * Why a payout request is refused. It is a union the API works out and the
 * dashboard reads; no column stores it, so it lives here beside the rest rather
 * than being written out again in each package.
 *
 * `stripe` is no connected account. `stripe-pending` is an account Stripe has
 * not yet cleared to receive money.
 */
export const PAYOUT_BLOCKS = ["open-request", "stripe", "stripe-pending", "below-minimum"] as const;

export type PayoutBlock = (typeof PAYOUT_BLOCKS)[number];

/**
 * A top-up opens the moment a member names an amount, so the row exists before the
 * money does. `paid` is the only state that ever put money in an account, and
 * `refunded` is a paid top-up whose unspent part went back as money.
 * `abandoned` is a checkout nobody finished.
 */
export const TOPUP_STATES = ["pending", "paid", "refunded", "abandoned"] as const;

export type TopupState = (typeof TOPUP_STATES)[number];

/**
 * Why a refund is refused. Like `PAYOUT_BLOCKS`, it is a union the API works out
 * and the dashboard reads; no column stores it.
 */
export const TOPUP_REFUND_BLOCKS = [
  "not-paid",
  "window-closed",
  "nothing-left",
  "below-fee",
] as const;

export type TopupRefundBlock = (typeof TOPUP_REFUND_BLOCKS)[number];

/**
 * Why a top-up amount is refused. The API works it out and answers with the
 * reason; no column stores it. The dashboard reads the bounds themselves.
 */
export const TOPUP_AMOUNT_BLOCKS = ["below-minimum", "above-maximum"] as const;

export type TopupAmountBlock = (typeof TOPUP_AMOUNT_BLOCKS)[number];

/**
 * One booking of a ticker slot. `booked` is paid and waits for the domain check
 * and the creative review. `running` counts its term. `ended` is a term that
 * is over. `refunded` is a booking whose charge went back before the term
 * started. Only `booked` and `running` hold a position.
 */
export const SLOT_STATES = ["booked", "running", "ended", "refunded"] as const;

export type SlotState = (typeof SLOT_STATES)[number];
