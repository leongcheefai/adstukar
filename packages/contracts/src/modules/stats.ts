import * as z from "zod/v4";

export const statsDayContract = z.object({
  day: z.string(), // YYYY-MM-DD (UTC)
  shown: z.number().int(),
  received: z.number().int(),
  clicks: z.number().int(),
});

export const statsOverviewOutput = z.object({
  balance: z.object({
    settled: z.number().int(),
    pending: z.number().int(),
  }),
  today: z.object({
    shown: z.number().int(),
    received: z.number().int(),
    clicks: z.number().int(),
    ctr: z.number(), // clicks / received, 0..1
  }),
  series: z.array(statsDayContract),
});

export type StatsDay = z.output<typeof statsDayContract>;
export type StatsOverview = z.output<typeof statsOverviewOutput>;
