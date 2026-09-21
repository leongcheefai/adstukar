import { cn } from "@repo/ui";
import type * as React from "react";

/** One figure of the offer: an icon, the figure, and what it is. The booking page shows two of them. */
export function Fact({
  icon,
  value,
  label,
  tone = "plain",
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  tone?: "plain" | "scarce";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-1 rounded-lg border px-4 py-5 text-center",
        tone === "scarce"
          ? "border-destructive/30 bg-destructive/5 text-destructive"
          : "bg-muted/40",
      )}
    >
      <span aria-hidden="true" className="[&_svg]:size-5">
        {icon}
      </span>
      <p className="text-2xl font-medium tracking-tight tabular-nums">{value}</p>
      <p className={cn("text-xs", tone === "plain" && "text-muted-foreground")}>{label}</p>
    </div>
  );
}
