import type { StatsDay } from "@repo/contracts/types";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@repo/ui";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { shortDay } from "../../lib/day-label";
import { CHART_HEIGHT } from "./chart-card";

/** No legend renders these names now. The tooltip still reads them on hover. */
const chartConfig = {
  shown: { label: "Shown", color: "var(--chart-1)" },
  received: { label: "Received", color: "var(--chart-2)" },
  clicks: { label: "Clicks", color: "var(--chart-3)" },
} satisfies ChartConfig;

export function ImpressionsChart({ data }: { data: StatsDay[] }) {
  const rows = data.map((d) => ({ ...d, label: shortDay(d.day) }));
  return (
    <ChartContainer
      config={chartConfig}
      className={`${CHART_HEIGHT} w-full [&_.recharts-cartesian-axis-tick_text]:tabular-nums`}
    >
      <LineChart data={rows} margin={{ left: 0, right: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          interval="preserveStartEnd"
          minTickGap={24}
        />
        <YAxis
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          tickMargin={4}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        {/* Three greys need a second signal. Weight of ink orders them, and the
            dash pattern separates the two lighter ones where they cross.

            Every line here sets isAnimationActive={false}. Recharts draws a line
            in by animating stroke-dasharray, and a ResponsiveContainer that
            resizes mid-draw leaves that value frozen at a short dash and a long
            gap. The line then renders as a stub. It also owns strokeDasharray,
            so the animation overwrites the two patterns below while it runs. */}
        <Line
          type="monotone"
          dataKey="shown"
          stroke="var(--chart-1)"
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="received"
          stroke="var(--chart-2)"
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="clicks"
          stroke="var(--chart-3)"
          strokeWidth={2}
          strokeDasharray="1 4"
          strokeLinecap="round"
          dot={false}
          isAnimationActive={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
