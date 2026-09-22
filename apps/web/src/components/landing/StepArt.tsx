import type { ReactNode } from "react";

/**
 * The three line drawings above the how-it-works steps, in the ON AIR orange.
 * Each is one screen, drawn the same way, so the row reads as one story:
 * a screen opens, a picture fills it, and the crawl along its foot pays. The
 * figure on the last one is a drawing, not a rate: the rates live in
 * `@repo/config/economy` and nothing on this page quotes them.
 * Outline only, one stroke weight, and no fill, so the drawing sits on the
 * tint and the canvas alike.
 */
export type StepArtName = "open" | "channel" | "earn";

const SCREEN = <rect x="12" y="10" width="72" height="46" rx="5" />;

const ART: Record<StepArtName, ReactNode> = {
  open: (
    <>
      {SCREEN}
      <path d="M12 22h72" />
      <circle cx="20" cy="16" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="26" cy="16" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="32" cy="16" r="1.4" fill="currentColor" stroke="none" />
      <path d="M40 30h16M40 38h32M40 46h24" />
    </>
  ),
  channel: (
    <>
      {SCREEN}
      <path d="M20 48l14-16 10 11 8-8 12 13" />
      <circle cx="64" cy="22" r="4" />
    </>
  ),
  earn: (
    <>
      {SCREEN}
      <path d="M12 44h72" />
      <path d="M22 50h10M38 50h14M58 50h18" />
      <text
        x="48"
        y="32"
        textAnchor="middle"
        fill="currentColor"
        stroke="none"
        fontFamily="var(--font-mono)"
        fontSize="13"
        fontWeight="500"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        $10.19
      </text>
    </>
  ),
};

export function StepArt({ name, className }: { name: StepArtName; className?: string }) {
  return (
    <svg
      viewBox="11 9 74 48"
      width="93"
      height="60"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {ART[name]}
    </svg>
  );
}
