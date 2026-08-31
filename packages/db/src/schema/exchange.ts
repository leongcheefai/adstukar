import { boolean, index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { user } from "./auth";
import { LEDGER_REASONS, LEDGER_STATES, PLACEMENT_SIZES, PRODUCT_STATUSES } from "./enums";

export const productStatusEnum = pgEnum("product_status", PRODUCT_STATUSES);
export const placementSizeEnum = pgEnum("placement_size", PLACEMENT_SIZES);
export const ledgerStateEnum = pgEnum("ledger_state", LEDGER_STATES);
export const ledgerReasonEnum = pgEnum("ledger_reason", LEDGER_REASONS);

export const product = pgTable(
  "product",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    url: text("url").notNull(),
    domain: text("domain").notNull(),
    tagline: text("tagline").notNull(),
    logoUrl: text("logo_url"),
    status: productStatusEnum("status").notNull().default("pending"),
    rejectionReason: text("rejection_reason"),
    verificationToken: text("verification_token").notNull(),
    verifiedAt: timestamp("verified_at"),
    advertise: boolean("advertise").notNull().default(true),
    showAds: boolean("show_ads").notNull().default(true),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("product_user_idx").on(t.userId), index("product_status_idx").on(t.status)],
);

export const placement = pgTable(
  "placement",
  {
    id: text("id").primaryKey(),
    productId: text("product_id")
      .notNull()
      .references(() => product.id, { onDelete: "cascade" }),
    apiKey: text("api_key").notNull().unique(),
    size: placementSizeEnum("size").notNull().default("small"),
    houseAdPct: integer("house_ad_pct").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("placement_product_idx").on(t.productId)],
);

export const excludedTerm = pgTable(
  "excluded_term",
  {
    id: text("id").primaryKey(),
    placementId: text("placement_id")
      .notNull()
      .references(() => placement.id, { onDelete: "cascade" }),
    phrase: text("phrase").notNull(),
  },
  (t) => [index("excluded_term_placement_idx").on(t.placementId)],
);

export const impression = pgTable(
  "impression",
  {
    id: text("id").primaryKey(),
    placementId: text("placement_id")
      .notNull()
      .references(() => placement.id, { onDelete: "cascade" }),
    servedProductId: text("served_product_id").references(() => product.id, {
      onDelete: "set null",
    }),
    house: boolean("house").notNull().default(false),
    sessionHash: text("session_hash").notNull(),
    viewable: boolean("viewable").notNull().default(false),
    viewedAt: timestamp("viewed_at"),
    clicked: boolean("clicked").notNull().default(false),
    clickedAt: timestamp("clicked_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("impression_placement_created_idx").on(t.placementId, t.createdAt),
    index("impression_product_created_idx").on(t.servedProductId, t.createdAt),
    index("impression_session_created_idx").on(t.sessionHash, t.createdAt),
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
    impressionId: text("impression_id").references(() => impression.id, { onDelete: "set null" }),
    relatedEntryId: text("related_entry_id"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    settlesAt: timestamp("settles_at"),
    settledAt: timestamp("settled_at"),
  },
  (t) => [
    index("ledger_entry_user_state_idx").on(t.userId, t.state),
    index("ledger_entry_user_created_idx").on(t.userId, t.createdAt),
    index("ledger_entry_settles_idx").on(t.state, t.settlesAt),
  ],
);
