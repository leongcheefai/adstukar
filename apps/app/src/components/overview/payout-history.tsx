import { usd } from "@repo/config/money";
import type { StatsDay } from "@repo/contracts/types";
import { type ChartConfig, ChartContainer, ChartTooltip, ChartTooltipContent } from "@repo/ui";
import { useId } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { shortDay } from "../../lib/day-label";
import {
  CHART_HEIGHT,
  ChartBodySkeleton,
  ChartCard,
  ChartCardFigure,
  ChartCardFigureSkeleton,
} from "./chart-card";

/** Days of history the card reports. Short enough that every day gets a dot. */
const WINDOW_DAYS = 14;

const TITLE = "Payout history";
const DESCRIPTION = "Earned each day";
const META_LABEL = `Past ${WINDOW_DAYS} days`;

const chartConfig = {
  earned: { label: "Earned", color: "var(--chart-1)" },
} satisfies ChartConfig;

interface PayoutDay {
  label: string;
  earned: number;
}

/**
 * A day of plays turned into the money it paid.
 *
 * The API already nets the fee off the earn, so this reads one field rather than
 * multiplying by a rate. A rate would be wrong anyway: it is tier by format now,
 * and one member may hold devices in several tiers.
 */
function toPayout(day: StatsDay): PayoutDay {
  return { label: shortDay(day.day), earned: day.earned };
}

/**
 * Daily earnings for the plays a member's devices ran.
 *
 * One series, so it takes an area rather than a line: the fill carries the
 * total the header states, and a single line would leave that quantity unread.
 */
export function PayoutHistory({ data }: { data: StatsDay[] }) {
  const rows = data.slice(-WINDOW_DAYS).map(toPayout);
  const total = rows.reduce((sum, row) => sum + row.earned, 0);
  // useId returns colons, which are not valid in a CSS url() reference.
  const fillId = `payout-fill-${useId().replace(/:/g, "")}`;

  // Only the ends are labelled. Fourteen dates below a chart this size would
  // collide, and the reader needs the span, not every step inside it.
  const first = rows[0]?.label;
  const last = rows.at(-1)?.label;
  const ticks = [...new Set([first, last].filter((tick): tick is string => Boolean(tick)))];

  return (
    <ChartCard
      title={TITLE}
      description={DESCRIPTION}
      metaLabel={META_LABEL}
      meta={<ChartCardFigure>{usd(total)}</ChartCardFigure>}
    >
      <ChartContainer
        config={chartConfig}
        className={`${CHART_HEIGHT} w-full [&_.recharts-cartesian-axis-tick_text]:tabular-nums`}
      >
        <AreaChart data={rows} margin={{ top: 8, left: 0, right: 20, bottom: 0 }}>
          <defs>
            {/* A gradient id is document-wide. Two of these cards on one page
                with a fixed id would make the second one paint the first. */}
            <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.22} />
              <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid className="stroke-border" vertical={false} />
          <XAxis
            dataKey="label"
            ticks={ticks}
            interval={0}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickMargin={12}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            tickMargin={4}
            tickCount={3}
            tickFormatter={usd}
            width={56}
          />
          <ChartTooltip
            content={<ChartTooltipContent formatter={(value) => usd(Number(value))} />}
          />
          {/* Linear, not monotone: a spline invents values between two days
              that no play was counted on. */}
          <Area
            type="linear"
            dataKey="earned"
            stroke="var(--chart-1)"
            strokeWidth={2}
            fill={`url(#${fillId})`}
            /* The ring is the card, not #fff: ChartContainer clears a #fff dot
               stroke, and the card is the surface the dot actually sits on. */
            dot={{ r: 4, fill: "var(--chart-1)", stroke: "var(--color-card)", strokeWidth: 2 }}
            activeDot={{
              r: 5,
              fill: "var(--chart-1)",
              stroke: "var(--color-card)",
              strokeWidth: 2,
            }}
            /* Recharts sweeps an area in behind a clip rect it sizes once. A
               ResponsiveContainer that resizes mid-sweep leaves that rect short,
               and the fill and the stroke stay hidden under it while the dots,
               which sit outside the clip, still draw. */
            isAnimationActive={false}
          />
        </AreaChart>
      </ChartContainer>
    </ChartCard>
  );
}

/** Loading twin. Same shell, so the row does not jump when the series lands. */
export function PayoutHistorySkeleton() {
  return (
    <ChartCard
      title={TITLE}
      description={DESCRIPTION}
      metaLabel={META_LABEL}
      meta={<ChartCardFigureSkeleton label={TITLE} />}
    >
      <ChartBodySkeleton />
    </ChartCard>
  );
}
