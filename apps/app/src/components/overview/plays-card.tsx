import type { StatsDay } from "@repo/contracts/types";
import {
  ChartBodySkeleton,
  ChartCard,
  ChartCardFigure,
  ChartCardFigureSkeleton,
} from "./chart-card";
import { PlaysChart } from "./plays-chart";

const WINDOW_DAYS = 30;

const TITLE = "Plays";
const DESCRIPTION = "Played on your screens, received by your listings, and scans";
const META_LABEL = `Past ${WINDOW_DAYS} days`;

/**
 * The three delivery series, under the one figure that orders them.
 *
 * The header states the played total because `played` is the series drawn in the
 * brand colour at full weight. A header figure that named a lighter line would
 * fight the chart it sits above.
 */
export function PlaysCard({ data }: { data: StatsDay[] }) {
  const rows = data.slice(-WINDOW_DAYS);
  const played = rows.reduce((sum, day) => sum + day.played, 0);

  return (
    <ChartCard
      title={TITLE}
      description={DESCRIPTION}
      metaLabel={META_LABEL}
      meta={<ChartCardFigure>{played.toLocaleString()}</ChartCardFigure>}
    >
      <PlaysChart data={rows} />
    </ChartCard>
  );
}

/** Loading twin. Same shell, so the row does not jump when the series lands. */
export function PlaysCardSkeleton() {
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
