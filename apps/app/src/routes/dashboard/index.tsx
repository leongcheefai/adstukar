import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";
import { ActivationFunnelChart } from "../../components/dashboard/charts/activation-funnel-chart";
import { ActiveUsersChart } from "../../components/dashboard/charts/active-users-chart";
import { PlanDistributionChart } from "../../components/dashboard/charts/plan-distribution-chart";
import { RevenueChart } from "../../components/dashboard/charts/revenue-chart";
import { SignupsChart } from "../../components/dashboard/charts/signups-chart";
import { TopCountriesChart } from "../../components/dashboard/charts/top-countries-chart";
import { KpiCard } from "../../components/dashboard/kpi-card";
import { useSession } from "../../lib/auth";
import { useMetrics } from "../../lib/metrics";

function SkeletonCard({ className = "" }: { className?: string }) {
  return <div className={`rounded-xl border bg-card animate-pulse ${className}`} />;
}

export function DashboardHome() {
  const { data: session } = useSession();
  const { data: metrics, isLoading, isError } = useMetrics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Welcome back{session?.user.name ? `, ${session.user.name}` : ""}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Here's what's happening with your account.
        </p>
      </div>

      {isError && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">Failed to load metrics. Please refresh.</p>
          </CardContent>
        </Card>
      )}

      {/* KPI strip */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading || !metrics ? (
          <>
            <SkeletonCard className="h-[100px]" />
            <SkeletonCard className="h-[100px]" />
            <SkeletonCard className="h-[100px]" />
            <SkeletonCard className="h-[100px]" />
          </>
        ) : (
          <>
            <KpiCard
              label="Monthly Recurring Revenue"
              value={`$${metrics.kpis.mrr.value.toLocaleString()}`}
              deltaPct={metrics.kpis.mrr.deltaPct}
            />
            <KpiCard
              label="New Signups (30d)"
              value={metrics.kpis.signups.value.toLocaleString()}
              deltaPct={metrics.kpis.signups.deltaPct}
            />
            <KpiCard
              label="Active Users (30d)"
              value={metrics.kpis.activeUsers.value.toLocaleString()}
              deltaPct={metrics.kpis.activeUsers.deltaPct}
            />
            <KpiCard
              label="Churn Rate"
              value={`${metrics.kpis.churnPct.value}%`}
              deltaPct={metrics.kpis.churnPct.deltaPct}
              deltaInverted
            />
          </>
        )}
      </div>

      {/* Chart grid */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Revenue */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Revenue (MRR)</CardTitle>
            <CardDescription>Monthly recurring revenue over 12 months</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !metrics ? (
              <SkeletonCard className="h-[200px]" />
            ) : (
              <RevenueChart data={metrics.revenue} />
            )}
          </CardContent>
        </Card>

        {/* Signups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Signups</CardTitle>
            <CardDescription>Weekly signups over the last 12 weeks</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !metrics ? (
              <SkeletonCard className="h-[200px]" />
            ) : (
              <SignupsChart data={metrics.signups} />
            )}
          </CardContent>
        </Card>

        {/* Active Users */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Active Users</CardTitle>
            <CardDescription>DAU / WAU / MAU over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !metrics ? (
              <SkeletonCard className="h-[200px]" />
            ) : (
              <ActiveUsersChart data={metrics.activeUsers} />
            )}
          </CardContent>
        </Card>

        {/* Plan Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Plan Distribution</CardTitle>
            <CardDescription>Users by subscription tier</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !metrics ? (
              <SkeletonCard className="h-[200px]" />
            ) : (
              <PlanDistributionChart data={metrics.planDistribution} />
            )}
          </CardContent>
        </Card>

        {/* Activation Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activation Funnel</CardTitle>
            <CardDescription>Users through each stage of activation</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !metrics ? (
              <SkeletonCard className="h-[200px]" />
            ) : (
              <ActivationFunnelChart data={metrics.activationFunnel} />
            )}
          </CardContent>
        </Card>

        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Countries</CardTitle>
            <CardDescription>Users by country (top 8)</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading || !metrics ? (
              <SkeletonCard className="h-[200px]" />
            ) : (
              <TopCountriesChart data={metrics.topCountries} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
