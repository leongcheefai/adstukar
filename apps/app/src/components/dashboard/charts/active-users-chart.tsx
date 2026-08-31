import type { MetricsOverview } from "@repo/contracts/types";
// Line chart — DAU/WAU/MAU multi-series
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/ui";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

interface ActiveUsersChartProps {
  data: MetricsOverview["activeUsers"];
}

const chartConfig = {
  dau: { label: "DAU", color: "var(--chart-1)" },
  wau: { label: "WAU", color: "var(--chart-2)" },
  mau: { label: "MAU", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function ActiveUsersChart({ data }: ActiveUsersChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="day" tick={{ fontSize: 11 }} interval={4} />
        <YAxis tick={{ fontSize: 11 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line type="monotone" dataKey="dau" stroke="var(--chart-1)" dot={false} strokeWidth={2} />
        <Line type="monotone" dataKey="wau" stroke="var(--chart-2)" dot={false} strokeWidth={2} />
        <Line type="monotone" dataKey="mau" stroke="var(--chart-3)" dot={false} strokeWidth={2} />
      </LineChart>
    </ChartContainer>
  );
}
