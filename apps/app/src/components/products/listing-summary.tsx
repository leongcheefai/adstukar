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
  points: "Available CapyPoints",
  impressions: "Impressions",
  clicks: "Clicks",
  ctr: "Click-through rate",
} as const;

/** The counted cards read the whole series, so they carry no window. */
const PERIOD = "All time";

/**
 * What every listing did, above the listings themselves.
 *
 * The balance is a running total, so it carries no period. The other three
 * count every day the API returns and say so.
 *
 * Each counted card shows what today added, because a running total on its own
 * never says whether the listing is still working. The two counts show today's
 * figure; the rate shows today's rate as a percent of the all-time rate.
 *
 * Same StatCard and same grid as Overview: a member who reads one page has
 * already learnt how to read the other.
 */
export function ListingSummary() {
  const { data: stats } = useStats();

  const days = stats?.series ?? [];
  const impressions = days.reduce((sum, day) => sum + day.received, 0);
  const clicks = days.reduce((sum, day) => sum + day.clicks, 0);
  // A quiet run divides by zero. Report 0%, never NaN%.
  const ctr = impressions > 0 ? clicks / impressions : 0;
  const pending = stats?.balance.pending ?? 0;

  // Today's rate as a percent of the all-time rate. A zero all-time rate is no
  // base to divide by, so the card shows no change rather than an infinity.
  const ctrChange = ctr > 0 ? (((stats?.today.ctr ?? 0) - ctr) / ctr) * 100 : null;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {stats ? (
        <>
          <StatCard
            label={LABELS.points}
            value={stats.balance.settled.toLocaleString()}
            meta={pending !== 0 ? `${pending > 0 ? "+" : ""}${pending} pending` : undefined}
          />
          <StatCard
            label={LABELS.impressions}
            value={impressions.toLocaleString()}
            meta={PERIOD}
            delta={<DeltaBadge value={stats.today.received} explain="Impressions today" />}
          />
          <StatCard
            label={LABELS.clicks}
            value={clicks.toLocaleString()}
            meta={PERIOD}
            delta={<DeltaBadge value={stats.today.clicks} explain="Clicks today" />}
          />
          <StatCard
            label={LABELS.ctr}
            value={`${(ctr * 100).toFixed(2)}%`}
            meta={PERIOD}
            delta={
              ctrChange === null ? undefined : (
                <DeltaBadge
                  value={ctrChange}
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
