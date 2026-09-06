import type { StatsDay } from "@repo/contracts/types";
import {
  ChartBodySkeleton,
  ChartCard,
  ChartCardFigure,
  ChartCardFigureSkeleton,
} from "./chart-card";
import { ImpressionsChart } from "./impressions-chart";

const WINDOW_DAYS = 30;

const TITLE = "Impressions";
const DESCRIPTION = "Shown and received, and clicks on your card";
const META_LABEL = `Past ${WINDOW_DAYS} days`;

/**
 * The three delivery series, under the one figure that orders them.
 *
 * The header states the shown total because `shown` is the series drawn in the
 * brand colour at full weight. A header figure that named a lighter line would
 * fight the chart it sits above.
 */
export function ImpressionsCard({ data }: { data: StatsDay[] }) {
  const rows = data.slice(-WINDOW_DAYS);
  const shown = rows.reduce((sum, day) => sum + day.shown, 0);

  return (
    <ChartCard
      title={TITLE}
      description={DESCRIPTION}
      metaLabel={META_LABEL}
      meta={<ChartCardFigure>{shown.toLocaleString()}</ChartCardFigure>}
    >
      <ImpressionsChart data={rows} />
    </ChartCard>
  );
}

/** Loading twin. Same shell, so the row does not jump when the series lands. */
export function ImpressionsCardSkeleton() {
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
