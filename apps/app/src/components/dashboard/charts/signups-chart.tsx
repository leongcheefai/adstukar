import type { MetricsOverview } from "@repo/contracts/types";
// Bar chart — New signups over 12 weeks
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@repo/ui";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface SignupsChartProps {
  data: MetricsOverview["signups"];
}

const chartConfig = {
  count: { label: "Signups", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function SignupsChart({ data }: SignupsChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--chart-2)" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
