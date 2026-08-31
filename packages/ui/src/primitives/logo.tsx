import type * as React from "react";
import { cn } from "../lib/utils";

interface LogoProps extends React.ComponentProps<"span"> {
  variant?: "mark" | "wordmark" | "full";
  size?: number;
}

// The mark SVG is a 48×48 square (bolt on indigo square).
// The wordmark SVG is 180×48: mark occupies x 0–48, text starts at x=60.
// When variant="wordmark", render the full 180×48 source (mark + text side by side).
// When variant="full", render the mark square independently then the text-only portion.
// When variant="mark", render only the mark square.

function Logo({ variant = "full", size = 24, className, ...props }: LogoProps) {
  // Mark: 1:1 square scaled to `size`
  const markHeight = size;
  const markWidth = size;

  // Text-only portion of wordmark: source viewBox 60,0 → 180,48 = 120×48
  // Scale height to `size`, width proportional (120/48 ratio)
  const textHeight = size;
  const textWidth = Math.round((120 / 48) * size);

  // Full wordmark (mark + text in one SVG): source 180×48, scale height to `size`
  const fullWordmarkHeight = size;
  const fullWordmarkWidth = Math.round((180 / 48) * size);

  if (variant === "mark") {
    return (
      <span
        data-slot="logo"
        className={cn("inline-flex items-center shrink-0", className)}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={markWidth}
          height={markHeight}
          viewBox="0 0 48 48"
          role="img"
          aria-label="Voltage"
        >
          <rect width="48" height="48" rx="4" fill="#4F46E5" />
          <path d="M27 10 L15 27 H22 L20 38 L33 21 H26 L27 10 Z" fill="#FFFFFF" />
        </svg>
      </span>
    );
  }

  if (variant === "wordmark") {
    return (
      <span
        data-slot="logo"
        className={cn("inline-flex items-center shrink-0", className)}
        {...props}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width={fullWordmarkWidth}
          height={fullWordmarkHeight}
          viewBox="0 0 180 48"
          role="img"
          aria-label="Voltage"
        >
          <rect width="48" height="48" rx="4" fill="#4F46E5" />
          <path d="M27 10 L15 27 H22 L20 38 L33 21 H26 L27 10 Z" fill="#FFFFFF" />
          <text
            x="60"
            y="32"
            fontFamily="Geist, system-ui, -apple-system, sans-serif"
            fontSize="24"
            fontWeight="600"
            fill="#18181B"
            letterSpacing="-0.6"
          >
            Voltage
          </text>
        </svg>
      </span>
    );
  }

  // variant === "full": separate mark + text-only SVG side by side
  return (
    <span
      data-slot="logo"
      className={cn("inline-flex items-center gap-2 shrink-0", className)}
      {...props}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={markWidth}
        height={markHeight}
        viewBox="0 0 48 48"
        role="img"
        aria-label="Voltage"
      >
        <rect width="48" height="48" rx="4" fill="#4F46E5" />
        <path d="M27 10 L15 27 H22 L20 38 L33 21 H26 L27 10 Z" fill="#FFFFFF" />
      </svg>
      {/* Text-only: crop the wordmark viewBox to only the text region (x=60..180) */}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={textWidth}
        height={textHeight}
        viewBox="60 0 120 48"
        aria-hidden="true"
      >
        <text
          x="60"
          y="32"
          fontFamily="Geist, system-ui, -apple-system, sans-serif"
          fontSize="24"
          fontWeight="600"
          fill="#18181B"
          letterSpacing="-0.6"
        >
          Voltage
        </text>
      </svg>
    </span>
  );
}

export { Logo };
export type { LogoProps };
