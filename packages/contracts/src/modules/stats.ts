import * as z from "zod/v4";

export const statsDayContract = z.object({
  day: z.string(), // YYYY-MM-DD (UTC)
  /** Counted plays on this member's own devices. */
  played: z.number().int(),
  /** Counted plays of this member's own listings, anywhere. */
  received: z.number().int(),
  /** Scans of this member's own listings. */
  scans: z.number().int(),
  /** Points this member's devices earned, net of the fee. */
  earned: z.number().int(),
});

export const statsOverviewOutput = z.object({
  balance: z.object({
    settled: z.number().int(),
    pending: z.number().int(),
    bought: z.number().int(),
    earned: z.number().int(),
    granted: z.number().int(),
  }),
  today: z.object({
    played: z.number().int(),
    received: z.number().int(),
    scans: z.number().int(),
    earned: z.number().int(),
    /** scans / received, 0..1 */
    scanRate: z.number(),
  }),
  series: z.array(statsDayContract),
});

export type StatsDay = z.output<typeof statsDayContract>;
export type StatsOverview = z.output<typeof statsOverviewOutput>;

/** Paid plays that finished their dwell. Public: the marketing site prints it. */
export const networkStatsOutput = z.object({
  plays: z.number().int().nonnegative(),
});

export type NetworkStats = z.output<typeof networkStatsOutput>;
