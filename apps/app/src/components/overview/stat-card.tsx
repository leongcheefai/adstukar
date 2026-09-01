import { Card, CardContent, CardHeader, CardTitle } from "@repo/ui";
import type * as React from "react";

export function StatCard({
  label,
  value,
  meta,
}: {
  label: string;
  value: string;
  /** Secondary figure, shown small at the top right. */
  meta?: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        {meta && <span className="shrink-0 text-xs text-muted-foreground">{meta}</span>}
      </CardHeader>
      <CardContent>
        <p className="text-4xl font-normal tracking-tight tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}
