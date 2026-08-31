import type { StatsDay } from "@repo/contracts/types";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@repo/ui";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  shown: { label: "Shown", color: "var(--chart-1)" },
  received: { label: "Received", color: "var(--chart-2)" },
  clicks: { label: "Clicks", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function ImpressionsChart({ data }: { data: StatsDay[] }) {
  const rows = data.map((d) => ({ ...d, label: d.day.slice(5) }));
  return (
    <ChartContainer config={chartConfig} className="h-[240px] w-full">
      <LineChart data={rows} margin={{ left: 0, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line type="monotone" dataKey="shown" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
        <Line
          type="monotone"
          dataKey="received"
          stroke="var(--chart-2)"
          strokeWidth={2}
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="clicks"
          stroke="var(--chart-3)"
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
