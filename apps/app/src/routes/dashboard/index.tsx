import { Button, Card, CardContent } from "@repo/ui";
import { BalanceCard } from "../../components/overview/balance-card";
import { PayoutHistory, PayoutHistorySkeleton } from "../../components/overview/payout-history";
import { RecentLedger } from "../../components/overview/recent-ledger";
import { RunningAdsCard } from "../../components/overview/running-ads-card";
import { useSession } from "../../lib/auth";
import { usePayouts } from "../../lib/payouts";
import { useStats } from "../../lib/stats";

/** Local clock, so the greeting matches the room the reader is sitting in. */
function greeting(now = new Date()): string {
  const hour = now.getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}

/** Loading twin of a whole card. Same shell, so the grid keeps its shape. */
function CardSkeleton({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-xl border bg-card ${className}`} aria-hidden />;
}

export function DashboardHome() {
  const { data: session } = useSession();
  const { data: stats, isError, isFetching, refetch } = useStats();
  const { data: payouts, isPending: payoutsLoading } = usePayouts();

  return (
    <div className="space-y-4">
      {/* pb-4 on top of the stack's own 16px, so the greeting gets 32px below
          it. It is set in the display face at the top of the type scale, and a
          line that large needs more air under it than the cards need between
          them. */}
      <div className="flex flex-wrap items-end justify-between gap-3 pb-4">
        <div className="min-w-0 space-y-1">
          <h1 data-slot="greeting">
            {greeting()}
            {session?.user.name ? `, ${session.user.name}` : ""}
          </h1>
        </div>
      </div>

      {isError && !stats ? (
        <Card className="border-destructive/50">
          <CardContent className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Could not load your stats</p>
              <p className="text-sm text-muted-foreground">
                Your wallet and history are safe. This is a read that failed.
              </p>
            </div>
            <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
              {isFetching ? "Retrying…" : "Try again"}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Two thirds and one third. The wide card carries the money and the
              narrow one carries the ads the money comes from. */}
          <div className="grid gap-3 xl:grid-cols-3">
            <div className="xl:col-span-2">
              {stats ? (
                <BalanceCard stats={stats} payouts={payouts} payoutsLoading={payoutsLoading} />
              ) : (
                <CardSkeleton className="h-72" />
              )}
            </div>
            <RunningAdsCard />
          </div>

          {stats ? <PayoutHistory data={stats.series} /> : <PayoutHistorySkeleton />}
        </>
      )}

      <RecentLedger />
    </div>
  );
}
