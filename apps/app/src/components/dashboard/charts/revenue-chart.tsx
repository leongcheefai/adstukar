import type { MetricsOverview } from "@repo/contracts/types";
// Area chart — MRR over 12 months
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@repo/ui";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";

interface RevenueChartProps {
  data: MetricsOverview["revenue"];
}

const chartConfig = {
  mrr: { label: "MRR", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
        <YAxis
          tickFormatter={(v: number) => `$${(v / 1000).toFixed(0)}k`}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          type="monotone"
          dataKey="mrr"
          stroke="var(--chart-1)"
          fill="var(--chart-1)"
          fillOpacity={0.2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
