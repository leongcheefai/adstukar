import type { MetricsOverview } from "@repo/contracts/types";
// Donut chart — Plan distribution
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/ui";
import { Cell, Pie, PieChart } from "recharts";

interface PlanDistributionChartProps {
  data: MetricsOverview["planDistribution"];
}

const PLAN_COLORS: Record<string, string> = {
  Free: "var(--chart-1)",
  Pro: "var(--chart-2)",
  Team: "var(--chart-3)",
  Enterprise: "var(--chart-4)",
};

const chartConfig = {
  users: { label: "Users" },
  Free: { label: "Free", color: "var(--chart-1)" },
  Pro: { label: "Pro", color: "var(--chart-2)" },
  Team: { label: "Team", color: "var(--chart-3)" },
  Enterprise: { label: "Enterprise", color: "var(--chart-4)" },
} satisfies ChartConfig;

export function PlanDistributionChart({ data }: PlanDistributionChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <PieChart>
        <Pie
          data={data}
          dataKey="users"
          nameKey="plan"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
        >
          {data.map((entry: { plan: string; users: number }) => (
            <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] ?? "var(--chart-1)"} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent nameKey="plan" />} />
        <ChartLegend content={<ChartLegendContent nameKey="plan" />} />
      </PieChart>
    </ChartContainer>
  );
}
