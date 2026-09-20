import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@repo/ui";
import type * as React from "react";

/** Both Overview charts stand this tall, so the pair aligns top and bottom. */
export const CHART_HEIGHT = "h-[240px]";

/**
 * The shell both Overview charts wear.
 *
 * The two sit in one row from xl, so the header lives here rather than in each
 * chart file. Two header idioms side by side would read as two systems.
 *
 * h-full lets the shorter card stretch to its neighbour, so the grid row ends
 * on one line rather than two.
 */
export function ChartCard({
  title,
  description,
  meta,
  children,
}: {
  title: string;
  description: string;
  /** The one figure the header states, or its skeleton. */
  meta: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card className="h-full gap-0 py-0">
      {/* The header carries the total, and the body carries the working. The
          rule between them says which is which. */}
      <CardHeader className="grid-cols-[1fr_auto] items-start gap-3 border-b px-6 py-5">
        <div className="min-w-0 space-y-1">
          <CardTitle className="text-base">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {/* The figure alone. The description beside it already names the
            period, so a label above the figure said it twice. */}
        <div className="col-start-2 row-span-2 row-start-1 shrink-0 self-center text-right">
          {meta}
        </div>
      </CardHeader>
      <CardContent className="px-6 py-5">{children}</CardContent>
    </Card>
  );
}

/** The header figure. Both cards state their total in this one face and size. */
export function ChartCardFigure({ children }: { children: React.ReactNode }) {
  return <p className="text-4xl font-normal tracking-tight tabular-nums">{children}</p>;
}

/** Loading twin of ChartCardFigure. Same box, so the header keeps its height. */
export function ChartCardFigureSkeleton({ label }: { label: string }) {
  return (
    <>
      <span
        className="ml-auto block h-10 w-24 animate-pulse rounded-md bg-muted"
        aria-hidden="true"
      />
      <span className="sr-only">Loading {label}</span>
    </>
  );
}

/** Fills the chart's own box, so the card does not resize when the series lands. */
export function ChartBodySkeleton() {
  return (
    <div
      className={`${CHART_HEIGHT} w-full animate-pulse rounded-lg bg-muted`}
      aria-hidden="true"
    />
  );
}
