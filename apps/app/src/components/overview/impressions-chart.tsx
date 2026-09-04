import type { StatsDay } from "@repo/contracts/types";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "@repo/ui";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";

const chartConfig = {
  shown: { label: "Shown", color: "var(--chart-1)" },
  received: { label: "Received", color: "var(--chart-2)" },
  clicks: { label: "Clicks", color: "var(--chart-3)" },
} satisfies ChartConfig;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * "2026-09-04" to "Sep 4".
 *
 * It reads the parts of the string. `new Date("2026-09-04")` parses as UTC
 * midnight, so a reader west of Greenwich would see every label one day early.
 */
function shortDay(day: string): string {
  const [, month, date] = day.split("-");
  const index = Number(month) - 1;
  if (!MONTHS[index] || !date) return day;
  return `${MONTHS[index]} ${Number(date)}`;
}

export function ImpressionsChart({ data }: { data: StatsDay[] }) {
  const rows = data.map((d) => ({ ...d, label: shortDay(d.day) }));
  return (
    <ChartContainer
      config={chartConfig}
      className="h-[240px] w-full [&_.recharts-cartesian-axis-tick_text]:tabular-nums"
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
        <ChartLegend content={<ChartLegendContent />} />
        {/* Three greys need a second signal. Weight of ink orders them, and the
            dash pattern separates the two lighter ones where they cross. */}
        <Line type="monotone" dataKey="shown" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
        <Line
          type="monotone"
          dataKey="received"
          stroke="var(--chart-2)"
          strokeWidth={2}
          strokeDasharray="6 4"
          dot={false}
        />
        <Line
          type="monotone"
          dataKey="clicks"
          stroke="var(--chart-3)"
          strokeWidth={2}
          strokeDasharray="1 4"
          strokeLinecap="round"
          dot={false}
        />
      </LineChart>
    </ChartContainer>
  );
}
