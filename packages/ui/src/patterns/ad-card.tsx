import type { PLACEMENT_FORMATS, PLACEMENT_SIZES } from "@repo/db/enums";
import type * as React from "react";
import { cn } from "../lib/utils";

/**
 * The fixed listing card, as CapyTV composes it over the screen's own content.
 *
 * The format is the region it fills, and the size is how much of the screen that
 * region takes. Understated by design: neutral surface, one label, never louder
 * than the content behind it.
 *
 * The radii are literals, not radius tokens: a retheme of the dashboard must not
 * silently reshape the card a viewer sees in a room.
 */
// Derived from the placement enums, not retyped: a new format has to be named
// here before this file compiles, so the card can never silently miss one.
// `@repo/db/enums` is plain tuples with no drizzle import, so nothing server-side
// reaches the browser through it.
export type AdCardFormat = (typeof PLACEMENT_FORMATS)[number];
export type AdCardSize = (typeof PLACEMENT_SIZES)[number];

/** The region at its reference size, in the pixels of a 1920×1080 screen. */
export const AD_CARD_DIMENSIONS: Record<AdCardFormat, { width: number; height: number }> = {
  band: { width: 960, height: 140 },
  float: { width: 380, height: 220 },
  ticker: { width: 960, height: 64 },
};

/** How much of the screen the region takes, against that reference. */
export const AD_CARD_SCALE: Record<AdCardSize, number> = {
  small: 0.75,
  medium: 1,
  large: 1.35,
};

export function adCardDimensions(format: AdCardFormat, size: AdCardSize) {
  const base = AD_CARD_DIMENSIONS[format];
  const scale = AD_CARD_SCALE[size];
  return { width: Math.round(base.width * scale), height: Math.round(base.height * scale) };
}

export interface AdCardProps extends Omit<React.ComponentProps<"div">, "children"> {
  name: string;
  tagline: string;
  logoUrl?: string | null;
  format?: AdCardFormat;
  size?: AdCardSize;
  label?: string;
}

function Monogram({ name, px, className }: { name: string; px: number; className?: string }) {
  return (
    <span
      aria-hidden
      style={{ width: px, height: px }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[6px] bg-muted font-semibold text-muted-foreground",
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

/**
 * A ticker has no room for a second line, and a float stacks instead of running
 * across, so each format gets its own body rather than one body with overrides.
 */
export function AdCard({
  name,
  tagline,
  logoUrl,
  format = "band",
  size = "medium",
  label = "Sponsored",
  className,
  ...props
}: AdCardProps) {
  const dims = adCardDimensions(format, size);
  const logoPx = format === "ticker" ? 32 : format === "float" ? 44 : 52;
  const logo = logoUrl ? (
    <img
      src={logoUrl}
      alt=""
      width={logoPx}
      height={logoPx}
      style={{ width: logoPx, height: logoPx }}
      className="shrink-0 rounded-md object-cover"
    />
  ) : (
    <Monogram name={name} px={logoPx} className={format === "ticker" ? "text-sm" : "text-lg"} />
  );

  return (
    <div
      data-slot="ad-card"
      data-format={format}
      style={{ width: dims.width, height: dims.height }}
      className={cn(
        "relative box-border flex max-w-full items-center gap-4 overflow-hidden rounded-[8px] border border-border bg-card px-4 text-card-foreground shadow-none",
        format === "float" && "flex-col items-start justify-center gap-3",
        className,
      )}
      {...props}
    >
      {logo}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold leading-tight">{name}</span>
        <span
          className={cn(
            "block text-sm leading-snug text-muted-foreground",
            format === "ticker" ? "hidden" : "line-clamp-2 mt-1",
          )}
        >
          {tagline}
        </span>
      </span>
      <span className="absolute top-2 right-3 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
    </div>
  );
}
