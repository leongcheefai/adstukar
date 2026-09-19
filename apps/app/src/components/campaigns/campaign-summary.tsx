import { usd, usdSigned } from "@repo/config/money";
import { useStats } from "../../lib/stats";
import { DeltaBadge } from "../delta-badge";
import { StatCard, StatCardSkeleton } from "../stat-card";

/**
 * One list, read by both the cards and the skeletons.
 *
 * The label is known before the figure is, so the skeleton shows it. That also
 * stops the two branches from drifting apart.
 */
const LABELS = {
  balance: "Balance",
  plays: "Plays received",
  scans: "Scans",
  scanRate: "Scan rate",
} as const;

/** The counted cards read the whole series, so they carry no window. */
const PERIOD = "All time";

/**
 * What every campaign did, above the campaigns themselves.
 *
 * The balance is a running total, so it carries no period. The other three count
 * every day the API returns and say so.
 *
 * Each counted card shows what today added, because a running total on its own
 * never says whether the campaign is still working. The two counts show today's
 * figure; the rate shows today's rate against the all-time rate.
 *
 * Same StatCard and same grid as Overview: a member who reads one page has
 * already learnt how to read the other.
 */
export function CampaignSummary() {
  const { data: stats } = useStats();

  const days = stats?.series ?? [];
  const plays = days.reduce((sum, day) => sum + day.received, 0);
  const scans = days.reduce((sum, day) => sum + day.scans, 0);
  // A quiet run divides by zero. Report 0%, never NaN%.
  const rate = plays > 0 ? scans / plays : 0;
  const pending = stats?.balance.pending ?? 0;

  // Today's rate as a percent of the all-time rate. A zero all-time rate is no
  // base to divide by, so the card shows no change rather than an infinity.
  const rateChange = rate > 0 ? (((stats?.today.scanRate ?? 0) - rate) / rate) * 100 : null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats ? (
        <>
          <StatCard
            label={LABELS.balance}
            value={usd(stats.balance.settled)}
            meta={pending !== 0 ? `${usdSigned(pending)} pending` : undefined}
          />
          <StatCard
            label={LABELS.plays}
            value={plays.toLocaleString()}
            meta={PERIOD}
            delta={<DeltaBadge value={stats.today.received} explain="Plays today" />}
          />
          <StatCard
            label={LABELS.scans}
            value={scans.toLocaleString()}
            meta={PERIOD}
            delta={<DeltaBadge value={stats.today.scans} explain="Scans today" />}
          />
          <StatCard
            label={LABELS.scanRate}
            value={`${(rate * 100).toFixed(2)}%`}
            meta={PERIOD}
            delta={
              rateChange === null ? undefined : (
                <DeltaBadge
                  value={rateChange}
                  format={(n) => `${n.toFixed(1)}%`}
                  explain="Today's rate against the all-time rate"
                />
              )
            }
          />
        </>
      ) : (
        Object.values(LABELS).map((label) => <StatCardSkeleton key={label} label={label} />)
      )}
    </div>
  );
}
