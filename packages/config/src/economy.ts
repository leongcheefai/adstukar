/**
 * Every economy number lives here. Routes, services, jobs, and the dashboard
 * read these values; none of them hardcodes an amount or a cap.
 *
 * The ledger holds one integer unit: one thousandth of a US dollar. Money
 * crosses the boundary twice: a top-up puts it in, and a payout takes it out.
 * See docs/adr/0001, docs/adr/0007, and docs/adr/0010.
 */
export const economy = {
  /**
   * The ledger unit. `perUsd` units make one US dollar, so `delta` stays an
   * integer and a play rate below one cent is still a whole number.
   */
  unit: { perUsd: 1000 },

  /**
   * What a venue screen earns for one play. The platform pays it from slot
   * revenue (docs/adr/0010), so the number a distributor reads is the number
   * they keep. There is no fee row.
   */
  earn: {
    /** Per 1,000 plays on a standard screen, as an amount ($2.00). */
    perThousandPlays: 2_000,
    /** What the admin stamps at approval. A new device starts at standard. */
    tierMultiplier: { standard: 1, premium: 1.5, flagship: 2 },
  },

  caps: {
    /** Plays one device may be paid for in one day. It bounds the money. */
    dailyPlaysPerDevice: 500,
    /**
     * Hours of one day a device may be paid for. It bounds the time: the paid
     * window opens at the device's first play of the day and closes this many
     * hours later. A venue is not open around the clock, so a screen that plays
     * all night is paid for none of it (docs/adr/0003).
     */
    paidHoursPerDay: 18,
  },

  /** Hours before a pending earn entry settles. */
  settlementDelayHours: 24,

  payout: {
    /** Days after settlement before earned money may leave as a payout. */
    holdDays: 30,
    /** The least one payout may take, as an amount. */
    minimum: 10_000,
    /**
     * Where a connected Stripe account may live, ISO 3166-1 alpha-2. The
     * platform is a Malaysia account, and Stripe lets a Malaysia platform
     * transfer to Malaysia accounts only (`country_specs/MY`,
     * `supported_transfer_countries`). The first is the default. Probed on
     * 2026-09-22 (docs/adr/0011). Probe again before launch.
     */
    countries: ["MY"],
    /**
     * Days of device history the fraud review reads before an admin pays. It
     * matches the hold, so the window an admin looks at is the window the hold
     * was meant to protect.
     */
    reviewWindowDays: 30,
    /**
     * Scans per play under which the review flags a device. An ambient screen
     * scans at 0.1-1% (docs/adr/0002), so a device far below that end of the
     * range is a screen that faces nobody. It is a flag, not a refusal: the
     * admin decides.
     */
    lowScanRatio: 0.001,
    /**
     * Plays a device must have run in the window before the scan ratio says
     * anything. Two plays and no scans is not evidence.
     */
    scanRatioMinPlays: 200,
  },

  /**
   * Months after settlement when an earned or granted entry expires. Bought
   * money never expires: somebody paid for it.
   */
  expiryMonths: 12,

  topup: {
    /**
     * What a top-up may be. Any whole-cent amount between the bounds, and the
     * presets are the quick buttons. Every amount is at the peg and none carries
     * a bonus: a bonus is not bought money, so a refund of it would have no
     * honest rate (docs/adr/0001).
     */
    amount: {
      minCents: 1_000,
      maxCents: 100_000,
      presetsCents: [1_000, 2_500, 10_000, 25_000],
    },
    /** Days after payment in which the unspent part of a top-up may go back as money. */
    refundWindowDays: 30,
    /**
     * What the card processor keeps on a sale, in basis points and whole cents.
     * A refund returns the money less this, because the processor does not give
     * it back. Basis points rather than a percent, so the number stays an integer.
     */
    processorFeeBps: 290,
    processorFeeFixedCents: 30,
  },

  placement: {
    /** Seconds one listing stays on a placement. */
    dwellSeconds: { min: 5, max: 30, default: 12 },
    /** Seconds of quiet between two plays on a device. */
    gapSeconds: { min: 30, max: 900, default: 180 },
  },

  /**
   * The ticker loop an advertiser books into. The loop holds a fixed count of
   * slots, and one slot is one brand for one term at one flat price. The price
   * follows the peg, so the points it costs are derived and never stored.
   */
  slot: {
    /** Slots in one loop. It is also how many bands the ticker prints. */
    count: 20,
    /** What one slot costs for one term. */
    priceUsdCents: 2_000,
    /** Days one booking holds its slot. */
    termDays: 7,
    /** Characters of the brand name a band shows. Every band is one width, so the copy is cut to fit. */
    nameMaxLength: 20,
    /** Characters of the tagline a band shows. */
    taglineMaxLength: 30,
  },

  /** Listings one campaign may hold, so an advertiser can compare them. */
  maxListingsPerCampaign: 4,

  taglineMaxLength: 60,

  excludedTerms: {
    max: 20,
    maxLength: 40,
  },

  /**
   * Listings one device may refuse by name. It also bounds the list the
   * dashboard shows, so the two can never disagree and truncate a veto set.
   */
  maxVetoesPerDevice: 500,

  /** Minutes an open play waits for its report before the job voids it. */
  playTtlMinutes: 10,

  /**
   * The batch CapyTV caches so a screen keeps playing when the network drops.
   * Every play in a batch is opened up front, so the batch holds its plays open
   * far longer than a live `/serve` does, and the device may report them late.
   */
  loop: {
    /** Plays one `/loop` call opens. About an hour of screen at the default gap. */
    size: 20,
    /** Minutes a cached play waits for its report before the job voids it. */
    playTtlMinutes: 240,
    /** Plays left in the batch when the screen asks for the next one. */
    refillAt: 5,
    /** Seconds between two tries. It is also how fast a screen comes back online. */
    refillIntervalSeconds: 60,
    /**
     * Reports one screen may owe before the oldest fall off the back. A screen
     * cannot be paid for more than the daily cap, so it can never honestly owe
     * more reports than that.
     */
    maxPendingReports: 500,
  },

  /**
   * The distributor's own promotion, played free when nothing paid is eligible.
   * It moves no money, so it carries no rate — only what fits on the overlay.
   */
  promotion: {
    taglineMaxLength: 60,
    nameMaxLength: 40,
  },

  rateLimit: {
    windowMs: 60_000,
    servePerKey: 600,
    servePerIp: 60,
    reportPerIp: 60,
    scanPerIp: 30,
  },
} as const;

/** Milliseconds in one day. Every window above is counted in days. */
export const DAY_MS = 86_400_000;

export type Economy = typeof economy;
export type DeviceTierRate = keyof typeof economy.earn.tierMultiplier;
export type PayoutCountry = (typeof economy.payout.countries)[number];

/** The rate is quoted per this many plays. It is not the peg, which is also 1000. */
const PLAYS_PER_RATE = 1000;

/**
 * What a screen of this tier earns for one play. Rounded down, so the ledger
 * never holds a part of a unit.
 */
export function earnPerPlay(tier: DeviceTierRate): number {
  return Math.floor(
    (economy.earn.perThousandPlays * economy.earn.tierMultiplier[tier]) / PLAYS_PER_RATE,
  );
}

/** One row of the published rate table: the tier, and what one play earns. */
export interface RateRow {
  tier: DeviceTierRate;
  perPlay: number;
}

/**
 * The rate table every page shows. The landing page and the dashboard read
 * this one derivation, so neither carries its own arithmetic.
 */
export function rateTable(): RateRow[] {
  return (Object.keys(economy.earn.tierMultiplier) as DeviceTierRate[]).map((tier) => ({
    tier,
    perPlay: earnPerPlay(tier),
  }));
}

/**
 * The money an amount is worth, in US cents. It rounds down, so a part of a
 * cent never becomes money we cannot pay.
 */
export function amountToCents(amount: number): number {
  return Math.floor((amount * 100) / economy.unit.perUsd);
}

/**
 * The amount a number of US cents is worth. A payout takes this rather than
 * the whole balance, so the part of a cent that `amountToCents` rounded away
 * stays in the member's account and rolls over to the next payout.
 */
export function centsToAmount(cents: number): number {
  return (cents * economy.unit.perUsd) / 100;
}

/** The flat price of one slot term, as an amount. */
export function slotPrice(): number {
  return centsToAmount(economy.slot.priceUsdCents);
}

/** The moment a slot term that starts at `from` is over. */
export function slotTermEnd(from: Date): Date {
  return new Date(from.getTime() + economy.slot.termDays * DAY_MS);
}
