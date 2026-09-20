import { pointsUsd } from "../../lib/money";
import { useStats } from "../../lib/stats";
import { DeltaBadge } from "../delta-badge";
import { StatCard, StatCardSkeleton } from "../stat-card";
import { AddFundsButton } from "../topups/add-funds-button";

/**
 * One list, read by both the cards and the skeletons.
 *
 * The label is known before the figure is, so the skeleton shows it. That also
 * stops the two branches from drifting apart.
 */
const LABELS = {
  points: "Wallet balance",
  impressions: "Impressions",
  ctr: "CTR",
} as const;

/** The counted cards read the whole series, so they carry no window. */
const PERIOD = "All time";

/**
 * What every campaign did, above the campaigns themselves.
 *
 * The balance is a running total, so it carries no period. The other two count
 * every day the API returns and say so.
 *
 * The API has no click, so the names map onto what it counts: an impression is
 * one play a listing received, and a click is one scan. CTR is scans over
 * impressions.
 *
 * Each counted card shows what today added, because a running total on its own
 * never says whether the campaign is still working. Impressions show today's
 * figure; CTR shows today's rate against the all-time rate.
 *
 * Same StatCard and same grid as Overview: a member who reads one page has
 * already learnt how to read the other.
 */
export function CampaignSummary({
  onAddFunds,
}: {
  /** Opens the top-up dialog. Undefined while the packs load, and the button waits. */
  onAddFunds: (() => void) | undefined;
}) {
  const { data: stats } = useStats();

  const days = stats?.series ?? [];
  const impressions = days.reduce((sum, day) => sum + day.received, 0);
  const scans = days.reduce((sum, day) => sum + day.scans, 0);
  // A quiet run divides by zero. Report 0%, never NaN%.
  const ctr = impressions > 0 ? scans / impressions : 0;
  const pending = stats?.balance.pending ?? 0;

  // Today's rate as a percent of the all-time rate. A zero all-time rate is no
  // base to divide by, so the card shows no change rather than an infinity.
  const ctrChange = ctr > 0 ? (((stats?.today.scanRate ?? 0) - ctr) / ctr) * 100 : null;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats ? (
        <>
          <StatCard
            label={LABELS.points}
            value={pointsUsd(stats.balance.settled)}
            action={<AddFundsButton size="sm" onClick={onAddFunds} disabled={!onAddFunds} />}
            meta={
              pending !== 0
                ? `${pending > 0 ? "+" : "−"}${pointsUsd(Math.abs(pending))} pending`
                : undefined
            }
          />
          <StatCard
            label={LABELS.impressions}
            value={impressions.toLocaleString()}
            meta={PERIOD}
            delta={<DeltaBadge value={stats.today.received} explain="Impressions today" />}
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
                  explain="Today's CTR against the all-time CTR"
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
