import { cn } from "@repo/ui";

/**
 * A hand-drawn arrow that points a first-run screen at the control it wants the
 * member to press. Decorative: it carries no meaning a screen reader needs, and
 * it must never intercept a click meant for the button behind it.
 */
export function ScribbleArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 200 260"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={cn("pointer-events-none select-none", className)}
    >
      <g
        stroke="currentColor"
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      >
        {/* One stroke: up from the text, a loop, then a straight run to the tip. */}
        <path d="M6 252C58 236 96 206 118 166c14-26 6-52-14-50-18 2-26 30-6 50 22 22 56-4 70-68l14-64" />
        {/* The head, drawn as two separate barbs so it keeps the sketched look. */}
        <path d="M182 34 154 58" />
        <path d="M182 34 197 66" />
      </g>
    </svg>
  );
}
