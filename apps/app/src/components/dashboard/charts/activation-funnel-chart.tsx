import type { MetricsOverview } from "@repo/contracts/types";
// Horizontal bar chart — Activation funnel
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@repo/ui";
import { Bar, BarChart, Cell, XAxis, YAxis } from "recharts";

interface ActivationFunnelChartProps {
  data: MetricsOverview["activationFunnel"];
}

const FUNNEL_COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const chartConfig = {
  count: { label: "Users", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function ActivationFunnelChart({ data }: ActivationFunnelChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 80 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="stage" tick={{ fontSize: 11 }} width={80} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {data.map((entry: { stage: string; count: number }, index: number) => (
            <Cell key={entry.stage} fill={FUNNEL_COLORS[index % FUNNEL_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}
