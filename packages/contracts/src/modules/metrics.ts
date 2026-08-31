import * as z from "zod/v4";

export const kpiMetricContract = z.object({
  value: z.number(),
  deltaPct: z.number(),
});

export const metricsOverviewOutput = z.object({
  kpis: z.object({
    mrr: kpiMetricContract,
    signups: kpiMetricContract,
    activeUsers: kpiMetricContract,
    churnPct: kpiMetricContract,
  }),
  revenue: z.array(z.object({ month: z.string(), mrr: z.number() })),
  signups: z.array(z.object({ week: z.string(), count: z.number() })),
  activeUsers: z.array(
    z.object({ day: z.string(), dau: z.number(), wau: z.number(), mau: z.number() }),
  ),
  planDistribution: z.array(z.object({ plan: z.string(), users: z.number() })),
  activationFunnel: z.array(z.object({ stage: z.string(), count: z.number() })),
  topCountries: z.array(z.object({ country: z.string(), users: z.number() })),
});

export type KpiMetric = z.output<typeof kpiMetricContract>;
export type MetricsOverview = z.output<typeof metricsOverviewOutput>;
