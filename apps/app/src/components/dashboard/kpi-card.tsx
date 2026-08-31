import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

interface KpiCardProps {
  label: string;
  value: string; // Pre-formatted: "$12,000" or "340" or "2.3%"
  deltaPct: number; // Positive = good (green), negative = bad (red), for churn: reversed
  deltaInverted?: boolean; // If true, positive delta = red (bad), negative = green (good)
  // For churn rate: deltaInverted=true so lower churn = green
}

export function KpiCard({ label, value, deltaPct, deltaInverted = false }: KpiCardProps) {
  const isPositive = deltaPct >= 0;
  const isGood = deltaInverted ? !isPositive : isPositive;
  const sign = isPositive ? "+" : "";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <p
          className={`mt-1 flex items-center gap-1 text-xs ${isGood ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}
        >
          {isPositive ? (
            <ArrowUpRight className="h-3 w-3" />
          ) : (
            <ArrowDownRight className="h-3 w-3" />
          )}
          {sign}
          {deltaPct.toFixed(1)}% vs last period
        </p>
      </CardContent>
    </Card>
  );
}
