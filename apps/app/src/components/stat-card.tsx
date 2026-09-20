import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import type * as React from "react";

/** Shell shared by the card and its skeleton, so the two cannot differ in height. */
function StatShell({
  header,
  children,
}: {
  header: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Card>
      {/* items-baseline, not items-start: the label and the meta are different
          sizes, so aligning their boxes leaves the smaller one riding high. */}
      <CardHeader className="flex flex-row items-baseline justify-between gap-2 pb-2">
        {header}
      </CardHeader>
      {/* h-10 is the line box of the text-4xl value. The skeleton fills the same
          box, so loading and loaded measure the same. */}
      <CardContent className="flex h-10 items-center">{children}</CardContent>
    </Card>
  );
}

export function StatCard({
  label,
  value,
  meta,
  delta,
  icon,
  action,
}: {
  label: string;
  value: string;
  /** Secondary figure, shown small at the top right. */
  meta?: React.ReactNode;
  /** The change, shown beside the figure. Usually a `DeltaBadge`. */
  delta?: React.ReactNode;
  /** Sits left of the figure. Decorative — the label already names the unit. */
  icon?: React.ReactNode;
  /** A control for the figure, at the right of it. It is a sibling of the figure, never inside it. */
  action?: React.ReactNode;
}) {
  return (
    <StatShell
      header={
        <>
          <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
          {meta && (
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{meta}</span>
          )}
        </>
      }
    >
      {/* The figure keeps the left edge every other card starts on, the change
          sits against it, and ml-auto still puts the icon out at the right rule.

          items-baseline, not items-center: the change is 12px type beside 36px
          type, so a centred badge floats halfway up the figure. On the baseline
          the two rows of digits sit on one line. The icon carries no baseline
          to share, so it keeps the centre. */}
      <p className="flex min-w-0 flex-1 items-baseline gap-3 text-4xl font-normal tracking-tight tabular-nums">
        {value}
        {delta}
        {icon && (
          <span aria-hidden="true" className="ml-auto shrink-0 self-center">
            {icon}
          </span>
        )}
      </p>
      {action && <div className="shrink-0">{action}</div>}
    </StatShell>
  );
}

/** Loading twin of StatCard. Same shell, so nothing moves when the figure lands. */
export function StatCardSkeleton({ label }: { label: string }) {
  return (
    <StatShell
      header={<CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>}
    >
      <span className="block h-7 w-20 animate-pulse rounded-md bg-muted" aria-hidden="true" />
      <span className="sr-only">Loading {label}</span>
    </StatShell>
  );
}
