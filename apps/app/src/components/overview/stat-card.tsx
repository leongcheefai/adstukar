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
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
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
  icon,
}: {
  label: string;
  value: string;
  /** Secondary figure, shown small at the top right. */
  meta?: React.ReactNode;
  /** Sits left of the figure. Decorative — the label already names the unit. */
  icon?: React.ReactNode;
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
      {/* w-full + justify-between: the figure keeps the left edge every other
          card starts on, and the icon sits out at the right rule. */}
      <p className="flex w-full items-center justify-between gap-2 text-4xl font-normal tracking-tight tabular-nums">
        {value}
        {icon && (
          <span aria-hidden="true" className="shrink-0">
            {icon}
          </span>
        )}
      </p>
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
