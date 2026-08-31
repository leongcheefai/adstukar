/**
 * Every economy number lives here. Routes, services, jobs, the embed, and the
 * dashboard read these values; none of them hardcodes a point amount or a cap.
 */
export const economy = {
  /** Points a host earns for one verified impression (pending until settled). */
  earnPerImpression: 1,
  /** Points an advertiser spends for one verified impression of its card. */
  spendPerImpression: 2,
  /** Hours before a pending earn entry settles. */
  settlementDelayHours: 24,
  /** Months after settlement when a settled earn entry expires. */
  expiryMonths: 12,
  grants: {
    /** Granted once when a product is approved. */
    productApproval: 50,
    /** Verified impressions a member's placements must show to unlock the milestone. */
    milestoneImpressions: 100,
    /** Granted once when the milestone is reached. */
    milestoneAmount: 150,
  },
  caps: {
    /** Counted impressions per visitor session per placement per day. */
    perSessionPerDay: 10,
    /** Earn entries per host domain per day. */
    newDomainDailyEarn: 1000,
  },
  /** Minutes an impression stays open for its viewability beacon. */
  impressionTtlMinutes: 10,
  viewability: {
    /** Fraction of the card that must be visible. */
    minRatio: 0.5,
    /** Milliseconds the card must stay visible. */
    minMs: 1000,
  },
  excludedTerms: {
    max: 20,
    maxLength: 40,
  },
  taglineMaxLength: 60,
  rateLimit: {
    windowMs: 60_000,
    servePerKey: 600,
    servePerIp: 60,
    beaconPerIp: 60,
  },
  cardSizes: {
    small: { width: 320, height: 64 },
    medium: { width: 300, height: 120 },
  },
} as const;

export type Economy = typeof economy;
