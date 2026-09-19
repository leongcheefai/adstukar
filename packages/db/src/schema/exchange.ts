import { sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  CAMPAIGN_PAUSE_REASONS,
  CAMPAIGN_STATES,
  DEVICE_STATES,
  DEVICE_TIERS,
  LEDGER_LOTS,
  LEDGER_REASONS,
  LEDGER_STATES,
  LISTING_STATES,
  PAYOUT_METHODS,
  PAYOUT_STATES,
  PLACEMENT_FORMATS,
  PLACEMENT_SIZES,
  PLAY_STATES,
  TOPUP_STATES,
  VENUE_TYPES,
} from "./enums";

export const campaignStateEnum = pgEnum("campaign_state", CAMPAIGN_STATES);
export const campaignPauseReasonEnum = pgEnum("campaign_pause_reason", CAMPAIGN_PAUSE_REASONS);
export const listingStateEnum = pgEnum("listing_state", LISTING_STATES);
export const deviceStateEnum = pgEnum("device_state", DEVICE_STATES);
export const deviceTierEnum = pgEnum("device_tier", DEVICE_TIERS);
export const venueTypeEnum = pgEnum("venue_type", VENUE_TYPES);
export const placementFormatEnum = pgEnum("placement_format", PLACEMENT_FORMATS);
export const placementSizeEnum = pgEnum("placement_size", PLACEMENT_SIZES);
export const playStateEnum = pgEnum("play_state", PLAY_STATES);
export const ledgerStateEnum = pgEnum("ledger_state", LEDGER_STATES);
export const ledgerReasonEnum = pgEnum("ledger_reason", LEDGER_REASONS);
export const ledgerLotEnum = pgEnum("ledger_lot", LEDGER_LOTS);
export const payoutStateEnum = pgEnum("payout_state", PAYOUT_STATES);
export const payoutMethodEnum = pgEnum("payout_method", PAYOUT_METHODS);
export const topupStateEnum = pgEnum("topup_state", TOPUP_STATES);

/**
 * One destination site and every listing that points at it. The advertiser owns
 * it. The domain check gates it, so `verifiedAt` decides whether it may run.
 */
export const campaign = pgTable(
  "campaign",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    domain: text("domain").notNull(),
    state: campaignStateEnum("state").notNull().default("draft"),
    /**
     * Why the system paused this campaign, and when. Both are null on a campaign
     * a person paused, and only that person starts one of those again.
     */
    pauseReason: campaignPauseReasonEnum("pause_reason"),
    pausedAt: timestamp("paused_at"),
    /** The most this campaign may spend in one day, as an amount. */
    dailyBudget: integer("daily_budget").notNull(),
    verificationToken: text("verification_token").notNull(),
    verifiedAt: timestamp("verified_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("campaign_user_idx").on(t.userId), index("campaign_state_idx").on(t.state)],
);

/**
 * One creative under a campaign. The name and the destination belong to the
 * campaign, so a listing carries only what changes between variants.
 */
export const listing = pgTable(
  "listing",
  {
    id: text("id").primaryKey(),
    campaignId: text("campaign_id")
      .notNull()
      .references(() => campaign.id, { onDelete: "cascade" }),
    tagline: text("tagline").notNull(),
    logoUrl: text("logo_url"),
    state: listingStateEnum("state").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("listing_campaign_idx").on(t.campaignId), index("listing_state_idx").on(t.state)],
);

/**
 * One physical screen running CapyTV. The distributor owns it. An admin
 * approves it and stamps the tier, which sets the rate it earns.
 */
export const device = pgTable(
  "device",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** What the distributor calls this screen. It never leaves the owner's account. */
    name: text("name").notNull(),
    /** The code the screen shows at pairing. The owner reads it off the screen. */
    deviceId: text("device_id").notNull().unique(),
    apiKey: text("api_key").notNull().unique(),
    venueType: venueTypeEnum("venue_type").notNull().default("other"),
    location: text("location").notNull(),
    /**
     * A photo of this screen in place. There is no device attestation, so the
     * photo is part of what an admin reviews before approval (docs/adr/0003).
     */
    photoUrl: text("photo_url"),
    /**
     * The distributor's own promotion. It plays free whenever nothing paid is
     * eligible, so it moves no money and carries no rate.
     */
    promotionName: text("promotion_name"),
    promotionTagline: text("promotion_tagline"),
    promotionUrl: text("promotion_url"),
    promotionLogoUrl: text("promotion_logo_url"),
    tier: deviceTierEnum("tier").notNull().default("standard"),
    state: deviceStateEnum("state").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    /** Plays this device may be paid for in one day. */
    dailyPlayCap: integer("daily_play_cap").notNull(),
    /**
     * When this screen was first approved. A device sent back for review keeps
     * it, because it is what tells the next approval that a key has already been
     * issued and paired. A rejection clears it: a refused screen was never
     * legitimately approved, so approving it later issues a fresh key.
     */
    approvedAt: timestamp("approved_at"),
    /**
     * The hours the venue states it is open, in its own time, and the zone that
     * makes them readable. A window that crosses midnight is one stretch, and a
     * venue open around the clock states the same hour twice.
     *
     * The payout review counts plays that fall outside them: a room that shuts
     * at six does not play to anybody at three in the morning.
     */
    openHour: integer("open_hour"),
    closeHour: integer("close_hour"),
    /** IANA zone, e.g. `Asia/Kuala_Lumpur`. The hours above are read in it. */
    timezone: text("timezone"),
    /**
     * The last report this screen sent. The payout hold exists to catch a dead
     * screen before cash leaves, so the review reads this before it pays.
     */
    lastSeenAt: timestamp("last_seen_at"),
    /**
     * The network the last report came from, as a prefix rather than an address:
     * `203.0.113.0/24` for IPv4 and the first four groups for IPv6. Several
     * devices on one network is a fraud signal, and a prefix answers that
     * question without keeping an address that identifies a household.
     */
    lastNetwork: text("last_network"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("device_user_idx").on(t.userId),
    index("device_state_idx").on(t.state),
    index("device_network_idx").on(t.lastNetwork),
  ],
);

/**
 * One overlay region on a device. A device may hold several, but only one paid
 * listing is on screen at a time — see docs/adr/0004.
 */
export const placement = pgTable(
  "placement",
  {
    id: text("id").primaryKey(),
    deviceId: text("device_id")
      .notNull()
      .references(() => device.id, { onDelete: "cascade" }),
    format: placementFormatEnum("format").notNull().default("band"),
    size: placementSizeEnum("size").notNull().default("medium"),
    /** Seconds one listing stays on this placement. */
    dwellSeconds: integer("dwell_seconds").notNull(),
    /** Seconds of quiet after a play before the device takes another. */
    gapSeconds: integer("gap_seconds").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("placement_device_idx").on(t.deviceId)],
);

/** A phrase the distributor refuses. It stops any listing that carries it. */
export const excludedTerm = pgTable(
  "excluded_term",
  {
    id: text("id").primaryKey(),
    deviceId: text("device_id")
      .notNull()
      .references(() => device.id, { onDelete: "cascade" }),
    phrase: text("phrase").notNull(),
  },
  (t) => [index("excluded_term_device_idx").on(t.deviceId)],
);

/**
 * One listing this device refuses by name. A veto is narrower than an excluded
 * term: the term stops anything that reads a certain way, the veto stops exactly
 * the creative the distributor looked at and did not want.
 */
export const vetoedListing = pgTable(
  "vetoed_listing",
  {
    id: text("id").primaryKey(),
    deviceId: text("device_id")
      .notNull()
      .references(() => device.id, { onDelete: "cascade" }),
    // Cascade, not restrict: a veto holds no money, so it may go with the
    // listing it refuses.
    listingId: text("listing_id")
      .notNull()
      .references(() => listing.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("vetoed_listing_device_idx").on(t.deviceId),
    unique("vetoed_listing_device_listing_key").on(t.deviceId, t.listingId),
  ],
);

/** One listing shown in one placement for its dwell. The event that moves money. */
export const play = pgTable(
  "play",
  {
    id: text("id").primaryKey(),
    // Restrict, not cascade: a play is where money came from, so dropping a
    // placement must never quietly take the record of its plays with it.
    placementId: text("placement_id")
      .notNull()
      .references(() => placement.id, { onDelete: "restrict" }),
    listingId: text("listing_id").references(() => listing.id, { onDelete: "set null" }),
    /** A house card. It moves no money. */
    house: boolean("house").notNull().default(false),
    state: playStateEnum("state").notNull().default("open"),
    scanned: boolean("scanned").notNull().default(false),
    /**
     * The moment this play stops being reportable. A live `/serve` gives minutes;
     * a cached `/loop` gives hours, because a screen off the network reports its
     * plays only when the network returns. The row carries the deadline so the
     * void job never has to know which path opened it.
     */
    expiresAt: timestamp("expires_at").notNull(),
    countedAt: timestamp("counted_at"),
    scannedAt: timestamp("scanned_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("play_placement_created_idx").on(t.placementId, t.createdAt),
    index("play_listing_created_idx").on(t.listingId, t.createdAt),
    index("play_state_created_idx").on(t.state, t.createdAt),
  ],
);

export const ledgerEntry = pgTable(
  "ledger_entry",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    delta: integer("delta").notNull(),
    state: ledgerStateEnum("state").notNull(),
    reason: ledgerReasonEnum("reason").notNull(),
    lot: ledgerLotEnum("lot").notNull(),
    playId: text("play_id").references(() => play.id, { onDelete: "set null" }),
    relatedEntryId: text("related_entry_id"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    settlesAt: timestamp("settles_at"),
    settledAt: timestamp("settled_at"),
  },
  (t) => [
    index("ledger_entry_user_state_idx").on(t.userId, t.state),
    index("ledger_entry_user_created_idx").on(t.userId, t.createdAt),
    index("ledger_entry_user_lot_idx").on(t.userId, t.lot, t.state),
    index("ledger_entry_settles_idx").on(t.state, t.settlesAt),
  ],
);

/**
 * Where a distributor's money goes. Identity is on file before the first payout,
 * not at signup, so this row appears the day a member asks to cash out.
 *
 * The destination is what a person reads to send the money by hand: an account
 * number, an IBAN, or a PayPal address. It is the member's own data and it never
 * leaves the payout review, so no contract that is not an admin one picks it.
 */
export const payoutAccount = pgTable("payout_account", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: "cascade" }),
  /** The name on the account. It must be the name we pay. */
  legalName: text("legal_name").notNull(),
  /** ISO 3166-1 alpha-2. It decides which rails an admin can use. */
  country: text("country").notNull(),
  method: payoutMethodEnum("method").notNull(),
  destination: text("destination").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * One distributor's request to turn earned money into a payment.
 *
 * The amount leaves the account the moment the request is made, as a `payout`
 * ledger entry on the `earned` lot. Holding them anywhere else would let one
 * balance answer two requests. A refusal posts the compensating row and the
 * amount comes back; it never edits the debit.
 *
 * `usdCents` is stored rather than derived, so a change to the peg never rewrites
 * what we already paid.
 */
export const payoutRequest = pgTable(
  "payout_request",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** The amount this request takes. Always positive. */
    amount: integer("amount").notNull(),
    usdCents: integer("usd_cents").notNull(),
    state: payoutStateEnum("state").notNull().default("requested"),
    /** The `payout` entry that took the amount. It is what a refusal reverses. */
    ledgerEntryId: text("ledger_entry_id").references(() => ledgerEntry.id, {
      onDelete: "restrict",
    }),
    /** What the admin typed after sending the money: a transfer reference. */
    reference: text("reference"),
    rejectionReason: text("rejection_reason"),
    reviewedBy: text("reviewed_by").references(() => user.id, { onDelete: "set null" }),
    reviewedAt: timestamp("reviewed_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("payout_request_user_created_idx").on(t.userId, t.createdAt),
    index("payout_request_state_idx").on(t.state, t.createdAt),
    // One open request per member, enforced by the database rather than by a
    // read-then-write: two taps on the button would both pass a check in code.
    uniqueIndex("payout_request_open_key")
      .on(t.userId)
      .where(sql`${t.state} = 'requested'`),
  ],
);

/**
 * One advertiser's top-up.
 *
 * The row opens when the member names an amount, so a checkout that nobody
 * finishes is visible rather than lost. `amount` and `usdCents` are stamped
 * here from what the server checked, never read back off Stripe: the price
 * a member paid must not move when the peg or the bounds do.
 *
 * A refund takes the unspent part back at the peg, less what the processor
 * kept, and posts a `refund` entry against the `bought` lot. It never edits the
 * `topup` entry, and it never deletes this row.
 */
export const topup = pgTable(
  "topup",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    /** The amount this top-up puts in. Always positive. */
    amount: integer("amount").notNull(),
    /** What the member paid, in US cents. */
    usdCents: integer("usd_cents").notNull(),
    state: topupStateEnum("state").notNull().default("pending"),
    /**
     * The checkout the member was sent to. It is stamped after the row exists,
     * so the row can never be lost to a Stripe call that half succeeded.
     */
    stripeSessionId: text("stripe_session_id").unique(),
    /**
     * The payment behind the money. It keys the ledger entry, and it is what a
     * refund sends the money back to.
     */
    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
    /** The `topup` entry that put the money in. */
    ledgerEntryId: text("ledger_entry_id").references(() => ledgerEntry.id, {
      onDelete: "restrict",
    }),
    /** The amount the refund took back, and the money it returned after the fee. */
    refunded: integer("refunded_amount"),
    refundUsdCents: integer("refund_usd_cents"),
    refundLedgerEntryId: text("refund_ledger_entry_id").references(() => ledgerEntry.id, {
      onDelete: "restrict",
    }),
    stripeRefundId: text("stripe_refund_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    /** When the money arrived. The refund window runs from here, not from `createdAt`. */
    paidAt: timestamp("paid_at"),
    refundedAt: timestamp("refunded_at"),
  },
  (t) => [
    index("topup_user_created_idx").on(t.userId, t.createdAt),
    index("topup_user_paid_idx").on(t.userId, t.paidAt),
    index("topup_state_idx").on(t.state),
  ],
);
