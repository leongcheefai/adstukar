/**
 * Every economy number lives here. Routes, services, jobs, and the dashboard
 * read these values; none of them hardcodes a point amount or a cap.
 *
 * A point is the only unit inside the system. Money crosses the boundary twice:
 * a top-up buys points, and a payout sells them back. See docs/adr/0001.
 */
export const economy = {
  /** Points in one US dollar. The peg is fixed, so `delta` stays an integer. */
  pointsPerUsd: 1000,

  /**
   * What an advertiser pays for one play, by device tier and placement format.
   * The tier is what an admin stamps at approval; the format is the region.
   */
  playRate: {
    standard: { band: 4, float: 6, ticker: 3 },
    premium: { band: 8, float: 12, ticker: 6 },
    flagship: { band: 16, float: 24, ticker: 12 },
  },

  /** What an advertiser pays on top when a viewer scans the code on a play. */
  scanRate: {
    standard: 40,
    premium: 80,
    flagship: 160,
  },

  /**
   * Percent of every play and every scan that CapyAds keeps. It is posted as an
   * explicit `fee` entry against the distributor, never as a hidden spread, so
   * the earn and the spend a member compares are the same published number.
   */
  feePercent: 30,

  grants: {
    /** Granted once, when a member's first listing is approved. */
    firstListingApproval: 2_000,
  },

  caps: {
    /** Plays one device may be paid for in one day. */
    dailyPlaysPerDevice: 500,
    /** Points one campaign may spend in one day, unless the advertiser sets less. */
    defaultDailyBudget: 20_000,
    /** The least a campaign may set as its daily budget. */
    minDailyBudget: 1_000,
  },

  /** Hours before a pending earn entry settles. */
  settlementDelayHours: 24,

  payout: {
    /** Days after settlement before earned points may leave as a payout. */
    holdDays: 30,
    /** The fewest points one payout may take. */
    minimumPoints: 20_000,
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
   * points never expire: somebody paid money for them.
   */
  expiryMonths: 12,

  /** What a top-up sells. The price follows the peg; the bonus does not. */
  topupPacks: [
    { points: 10_000, usdCents: 1_000 },
    { points: 50_000, usdCents: 5_000 },
    { points: 250_000, usdCents: 25_000 },
  ],

  placement: {
    /** Seconds one listing stays on a placement. */
    dwellSeconds: { min: 5, max: 30, default: 12 },
    /** Seconds of quiet between two plays on a device. */
    gapSeconds: { min: 30, max: 900, default: 180 },
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
   * It moves no points, so it carries no rate — only what fits on the overlay.
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

export type Economy = typeof economy;
export type DeviceTierRate = keyof typeof economy.playRate;
export type PlacementFormatRate = keyof (typeof economy.playRate)["standard"];

/** The advertiser's cost for one play. */
export function playCost(tier: DeviceTierRate, format: PlacementFormatRate): number {
  return economy.playRate[tier][format];
}

/** The advertiser's extra cost when that play is scanned. */
export function scanCost(tier: DeviceTierRate): number {
  return economy.scanRate[tier];
}

/**
 * The points CapyAds keeps from one movement. Rounded down, so the distributor
 * never loses a point to rounding and the two sides always add up.
 */
export function feeOn(amount: number): number {
  return Math.floor((amount * economy.feePercent) / 100);
}

/**
 * The play rate is tier by format, so no single number describes it. Copy that
 * quotes a rate quotes this range, and derives it here rather than in each page.
 */
export function playRateRange(): { lowest: number; highest: number } {
  const rates = Object.values(economy.playRate).flatMap((byFormat) => Object.values(byFormat));
  return { lowest: Math.min(...rates), highest: Math.max(...rates) };
}

/** The percent of a play or a scan the distributor keeps, after the fee. */
export function distributorPercent(): number {
  return 100 - economy.feePercent;
}

/**
 * The money a number of points is worth, in US cents. It rounds down, so a part
 * of a cent never becomes money we cannot pay.
 */
export function pointsToUsdCents(points: number): number {
  return Math.floor((points * 100) / economy.pointsPerUsd);
}

/**
 * The points a number of US cents is worth. A payout takes this rather than the
 * whole balance, so the part of a cent that `pointsToUsdCents` rounded away
 * stays in the member's account and rolls over to the next payout.
 */
export function usdCentsToPoints(cents: number): number {
  return (cents * economy.pointsPerUsd) / 100;
}
