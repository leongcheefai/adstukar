import { Coin } from "@phosphor-icons/react";
import { Button, Card, CardContent } from "@repo/ui";
import { Link } from "react-router";
import {
  ImpressionsCard,
  ImpressionsCardSkeleton,
} from "../../components/overview/impressions-card";
import { PayoutHistory, PayoutHistorySkeleton } from "../../components/overview/payout-history";
import { RecentLedger } from "../../components/overview/recent-ledger";
import { StatCard, StatCardSkeleton } from "../../components/stat-card";
import { useSession } from "../../lib/auth";
import { useProducts } from "../../lib/products";
import { useStats } from "../../lib/stats";

/** Local clock, so the greeting matches the room the reader is sitting in. */
function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

/**
 * One list, read by both the loaded cards and the skeletons.
 *
 * The label is known before the figure is, so the skeleton shows it. That also
 * stops the two branches from drifting apart.
 */
const STAT_LABELS = {
  points: "CapyPoints",
  shown: "Shown today",
  received: "Received today",
  clicks: "Clicks today",
} as const;

export function DashboardHome() {
  const { data: session } = useSession();
  const { data: stats, isError, isFetching, refetch } = useStats();
  const { data: products } = useProducts();
  const noProducts = products !== undefined && products.length === 0;

  // The API divides by received, which is zero on a quiet day.
  const ctr = stats && Number.isFinite(stats.today.ctr) ? stats.today.ctr : 0;
  const pending = stats?.balance.pending ?? 0;

  return (
    <div className="space-y-4">
      {/* pb-4 on top of the stack's own 16px, so the greeting gets 32px below
          it. It is set in the display face at the top of the type scale, and a
          line that large needs more air under it than the cards need between
          them. */}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-4">
        <h1 data-slot="greeting" className="min-w-0">
          {greeting()}
          {session?.user.name ? `, ${session.user.name}` : ""}
        </h1>
        {noProducts && (
          <Button asChild size="sm">
            <Link to="/dashboard/products">Register your first product</Link>
          </Button>
        )}
      </div>

      {isError && !stats ? (
        <Card className="border-destructive/50">
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Could not load your stats</p>
              <p className="text-sm text-muted-foreground">
                Your CapyPoints and history are safe. This is a read that failed.
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Retrying…" : "Try again"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {stats ? (
              <>
                <StatCard
                  label={STAT_LABELS.points}
                  value={stats.balance.settled.toLocaleString()}
                  meta={pending !== 0 ? `${pending > 0 ? "+" : ""}${pending} pending` : undefined}
                  icon={<Coin size={28} weight="fill" className="text-primary" />}
                />
                <StatCard label={STAT_LABELS.shown} value={stats.today.shown.toLocaleString()} />
                <StatCard
                  label={STAT_LABELS.received}
                  value={stats.today.received.toLocaleString()}
                />
                <StatCard
                  label={STAT_LABELS.clicks}
                  value={stats.today.clicks.toLocaleString()}
                  meta={`CTR ${(ctr * 100).toFixed(1)}%`}
                />
              </>
            ) : (
              Object.values(STAT_LABELS).map((label) => (
                <StatCardSkeleton key={label} label={label} />
              ))
            )}
          </div>

          {/* Two charts, one row from xl. Below that the sidebar leaves each
              half too narrow for a thirty-day series, so they stack. */}
          <div className="grid gap-3 xl:grid-cols-2">
            {stats ? <PayoutHistory data={stats.series} /> : <PayoutHistorySkeleton />}
            {stats ? <ImpressionsCard data={stats.series} /> : <ImpressionsCardSkeleton />}
          </div>
        </>
      )}

      <RecentLedger />
    </div>
  );
}
