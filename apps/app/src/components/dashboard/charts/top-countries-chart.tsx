import type { MetricsOverview } from "@repo/contracts/types";
// Horizontal bar chart — Top countries
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@repo/ui";
import { Bar, BarChart, XAxis, YAxis } from "recharts";

interface TopCountriesChartProps {
  data: MetricsOverview["topCountries"];
}

const chartConfig = {
  users: { label: "Users", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function TopCountriesChart({ data }: TopCountriesChartProps) {
  return (
    <ChartContainer config={chartConfig} className="h-[200px] w-full">
      <BarChart data={data} layout="vertical" margin={{ left: 32 }}>
        <XAxis type="number" tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="country" tick={{ fontSize: 11 }} width={32} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="users" fill="var(--chart-2)" radius={[0, 4, 4, 0]} />
      </BarChart>
    </ChartContainer>
  );
}
