import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";
import { Link } from "react-router";
import { ImpressionsChart } from "../../components/overview/impressions-chart";
import { RecentLedger } from "../../components/overview/recent-ledger";
import { StatCard } from "../../components/overview/stat-card";
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

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl border bg-card animate-pulse ${className}`} />;
}

export function DashboardHome() {
  const { data: session } = useSession();
  const { data: stats, isLoading, isError } = useStats();
  const { data: products } = useProducts();
  const noProducts = products !== undefined && products.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 data-slot="greeting">
            {greeting()}
            {session?.user.name ? `, ${session.user.name}` : ""}
          </h1>
        </div>
        {noProducts && (
          <Button asChild size="sm">
            <Link to="/dashboard/products">Register your first product</Link>
          </Button>
        )}
      </div>

      {isError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Failed to load stats. Please refresh.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !stats ? (
          <>
            <Skeleton className="h-[124px]" />
            <Skeleton className="h-[124px]" />
            <Skeleton className="h-[124px]" />
            <Skeleton className="h-[124px]" />
          </>
        ) : (
          <>
            <StatCard label="Points" value={stats.balance.settled.toLocaleString()} />
            <StatCard label="Shown today" value={stats.today.shown.toLocaleString()} />
            <StatCard label="Received today" value={stats.today.received.toLocaleString()} />
            <StatCard
              label="Clicks today"
              value={stats.today.clicks.toLocaleString()}
              meta={`CTR ${(stats.today.ctr * 100).toFixed(1)}%`}
            />
          </>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Last 30 days</CardTitle>
          <CardDescription>
            Verified impressions shown and received, and clicks on your card
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || !stats ? (
            <Skeleton className="h-[240px]" />
          ) : (
            <ImpressionsChart data={stats.series} />
          )}
        </CardContent>
      </Card>

      <RecentLedger />
    </div>
  );
}
