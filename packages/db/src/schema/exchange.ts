import { boolean, index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import {
  CAMPAIGN_STATES,
  DEVICE_STATES,
  DEVICE_TIERS,
  LEDGER_LOTS,
  LEDGER_REASONS,
  LEDGER_STATES,
  LISTING_STATES,
  PLACEMENT_FORMATS,
  PLACEMENT_SIZES,
  PLAY_STATES,
  VENUE_TYPES,
} from "./enums";

export const campaignStateEnum = pgEnum("campaign_state", CAMPAIGN_STATES);
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
    /** Points this campaign may spend in one day. */
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
    /** The code the screen shows at pairing. The owner reads it off the screen. */
    deviceId: text("device_id").notNull().unique(),
    apiKey: text("api_key").notNull().unique(),
    venueType: venueTypeEnum("venue_type").notNull().default("other"),
    location: text("location").notNull(),
    tier: deviceTierEnum("tier").notNull().default("standard"),
    state: deviceStateEnum("state").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    /** Plays this device may be paid for in one day. */
    dailyPlayCap: integer("daily_play_cap").notNull(),
    approvedAt: timestamp("approved_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("device_user_idx").on(t.userId), index("device_state_idx").on(t.state)],
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

/** One listing shown in one placement for its dwell. The event that moves points. */
export const play = pgTable(
  "play",
  {
    id: text("id").primaryKey(),
    // Restrict, not cascade: a play is where points came from, so dropping a
    // placement must never quietly take the record of its plays with it.
    placementId: text("placement_id")
      .notNull()
      .references(() => placement.id, { onDelete: "restrict" }),
    listingId: text("listing_id").references(() => listing.id, { onDelete: "set null" }),
    /** A house card. It moves no points. */
    house: boolean("house").notNull().default(false),
    state: playStateEnum("state").notNull().default("open"),
    scanned: boolean("scanned").notNull().default(false),
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
