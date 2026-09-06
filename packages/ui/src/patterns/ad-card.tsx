import type * as React from "react";
import { cn } from "../lib/utils";

/**
 * The fixed sponsored-card template, React edition. `apps/embed/src/card.ts` renders the
 * same layout in vanilla DOM on member sites; keep the two in step when either changes.
 * Understated by design: neutral surface, one label, never louder than the host page.
 *
 * The radii are literals, not radius tokens, because card.ts hardcodes 8px and 6px on
 * member sites. A retheme of this app must not silently reshape the card that the
 * landing page presents as a preview of the real thing.
 */
export type AdCardSize = "small" | "medium";

export const AD_CARD_DIMENSIONS: Record<AdCardSize, { width: number; height: number }> = {
  small: { width: 320, height: 64 },
  medium: { width: 300, height: 120 },
};

export interface AdCardProps extends Omit<React.ComponentProps<"a">, "href"> {
  name: string;
  tagline: string;
  logoUrl?: string | null;
  href?: string;
  size?: AdCardSize;
  label?: string;
}

function Monogram({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-[6px] bg-muted font-semibold text-muted-foreground",
        className,
      )}
    >
      {name.trim().charAt(0).toUpperCase() || "?"}
    </span>
  );
}

export function AdCard({
  name,
  tagline,
  logoUrl,
  href = "#",
  size = "small",
  label = "Sponsored",
  className,
  ...props
}: AdCardProps) {
  const dims = AD_CARD_DIMENSIONS[size];
  const logoSize = size === "small" ? "size-10" : "size-12";
  const logo = logoUrl ? (
    <img
      src={logoUrl}
      alt=""
      width={size === "small" ? 40 : 48}
      height={size === "small" ? 40 : 48}
      className={cn("shrink-0 rounded-md object-cover", logoSize)}
    />
  ) : (
    <Monogram name={name} className={cn(logoSize, size === "small" ? "text-base" : "text-lg")} />
  );

  return (
    <a
      href={href}
      rel="sponsored noopener"
      target="_blank"
      data-slot="ad-card"
      style={{ width: dims.width, height: dims.height }}
      className={cn(
        "relative box-border flex max-w-full items-center gap-3 overflow-hidden rounded-[8px] border border-border bg-card px-3 text-card-foreground no-underline shadow-none transition-colors hover:border-[color:var(--color-border-strong)]",
        size === "medium" && "items-start pt-3",
        className,
      )}
      {...props}
    >
      {logo}
      <span className="min-w-0 flex-1 pr-14">
        <span className="block truncate text-[13px] font-semibold leading-tight">{name}</span>
        <span
          className={cn(
            "block text-xs leading-snug text-muted-foreground",
            size === "small" ? "truncate" : "line-clamp-3 mt-0.5",
          )}
        >
          {tagline}
        </span>
      </span>
      <span className="absolute top-2 right-2.5 text-[10px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </span>
    </a>
  );
}
