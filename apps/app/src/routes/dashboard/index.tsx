import { economy } from "@repo/config/economy";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@repo/ui";
import { Info } from "lucide-react";
import { Link } from "react-router";
import { ImpressionsChart } from "../../components/overview/impressions-chart";
import { StatCard } from "../../components/overview/stat-card";
import { useSession } from "../../lib/auth";
import { useProducts } from "../../lib/products";
import { useStats } from "../../lib/stats";

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
          <h1 className="text-2xl font-semibold tracking-tight">
            Overview{session?.user.name ? ` · ${session.user.name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Show {economy.spendPerImpression} ads, earn {economy.earnPerImpression} for yourself.
          </p>
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
            <Skeleton className="h-[110px]" />
            <Skeleton className="h-[110px]" />
            <Skeleton className="h-[110px]" />
            <Skeleton className="h-[110px]" />
          </>
        ) : (
          <>
            <StatCard label="Points" value={stats.balance.settled.toLocaleString()}>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <p className="mt-1 inline-flex cursor-help items-center gap-1 font-mono text-xs text-muted-foreground/70">
                      +{stats.balance.pending.toLocaleString()} pending
                      <Info size={11} />
                    </p>
                  </TooltipTrigger>
                  <TooltipContent>
                    Earned points settle {economy.settlementDelayHours} hours after the impression.
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </StatCard>
            <StatCard
              label="Shown today"
              value={stats.today.shown.toLocaleString()}
              hint={`+${economy.earnPerImpression} each once verified`}
            />
            <StatCard
              label="Received today"
              value={stats.today.received.toLocaleString()}
              hint={`−${economy.spendPerImpression} each`}
            />
            <StatCard
              label="Clicks today"
              value={stats.today.clicks.toLocaleString()}
              hint={`CTR ${(stats.today.ctr * 100).toFixed(1)}%`}
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
    </div>
  );
}
