import { Badge, Tooltip, TooltipContent, TooltipTrigger } from "@repo/ui";

/**
 * The change beside a figure: green up, red down, grey flat.
 *
 * The colour is never the only signal. The sign carries the same meaning, so
 * the badge still reads for a member who cannot separate the two hues.
 */
export function DeltaBadge({
  value,
  format = (n) => n.toLocaleString(),
  explain,
}: {
  value: number;
  /** Renders the absolute figure. The sign is added here. */
  format?: (absolute: number) => string;
  /** What the change is measured against. */
  explain: string;
}) {
  const direction = value > 0 ? "up" : value < 0 ? "down" : "flat";
  // U+2212, not a hyphen: it is the width of the plus, so a column of badges
  // keeps its digits aligned.
  const sign = direction === "up" ? "+" : direction === "down" ? "−" : "";
  const label = `${sign}${format(Math.abs(value))}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge
          variant={direction === "up" ? "success" : direction === "down" ? "danger" : "neutral"}
          // overflow-visible so the badge reports its text baseline. An
          // inline-flex box that clips synthesizes the baseline from its bottom
          // edge instead, and the row it sits in aligns on baselines.
          className="shrink-0 cursor-help overflow-visible"
        >
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{explain}</TooltipContent>
    </Tooltip>
  );
}
