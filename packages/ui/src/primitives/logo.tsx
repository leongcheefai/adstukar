import type * as React from "react";
import { useId } from "react";
import { cn } from "../lib/utils";

/**
 * CapyAds logo. Both parts draw in `currentColor`, so the same component works
 * on a white section and on a blue slab without a colour prop.
 *
 * The mark knocks the capybara out of a filled square with a mask instead of
 * painting it in a second colour. That keeps it to one ink and lets the eyes
 * and muzzle pick up whatever sits behind the logo, including in dark mode.
 * It assumes a flat background, which is where a logo belongs anyway.
 *
 * WORDMARK_PATH is traced from the brand deck, not set in a typeface, so the
 * letterforms cannot drift when the font stack changes.
 */
const WORDMARK_PATH =
  "M79.4 153.2C35 153.2 7.2 123.8 7.2 77C7.2 30.8 36.6 0.4 80.8 0.4C117.8 0.4 144.4 21.6 149 54.8L114.8 54.8C110.4 40 97.8 31.6 80 31.6C56 31.6 41.4 48.6 41.4 76.8C41.4 104.6 56.2 122 80 122C98.2 122 111.6 113 115.6 98.4L149.2 98.4C144 131.4 116.4 153.2 79.4 153.2Z M148.44 150.8Z M184.04 150.8L150.24 150.8L203.04 2.8L234.64 2.8L287.24 150.8L252.84 150.8L242.44 119.6L194.64 119.6L184.04 150.8Z M214.64 60.8L204.04 92.4L233.24 92.4L222.64 60.8C221.04 55.8 219.24 50 218.64 46.4C218.04 49.8 216.44 55.4 214.64 60.8Z M289.06 150.8Z M364.46 101.6L336.86 101.6L336.86 150.8L304.46 150.8L304.46 2.8L364.46 2.8C394.66 2.8 414.86 22.6 414.86 52.2C414.86 81.8 394.66 101.6 364.46 101.6Z M357.26 31.6L336.86 31.6L336.86 72.8L357.26 72.8C372.86 72.8 380.66 66 380.66 52.2C380.66 38.4 372.86 31.6 357.26 31.6Z M419.92 150.8Z M471.92 94.6L421.92 2.8L458.12 2.8L482.92 50.8C485.32 55.4 486.92 59 488.52 62.8C490.32 59.2 491.92 55.4 494.32 50.6L519.12 2.8L554.32 2.8L504.32 94.6L504.32 150.8L471.92 150.8L471.92 94.6Z M540.23 150.8Z M575.83 150.8L542.03 150.8L594.83 2.8L626.43 2.8L679.03 150.8L644.63 150.8L634.23 119.6L586.43 119.6L575.83 150.8Z M606.43 60.8L595.83 92.4L625.03 92.4L614.43 60.8C612.83 55.8 611.03 50 610.43 46.4C609.83 49.8 608.23 55.4 606.43 60.8Z M680.86 150.8Z M754.26 150.8L696.26 150.8L696.26 2.8L752.26 2.8C795.66 2.8 825.86 33.2 825.86 77.2C825.86 120.4 796.46 150.8 754.26 150.8Z M749.06 32.8L728.66 32.8L728.66 120.8L751.06 120.8C776.66 120.8 791.66 104.6 791.66 77.2C791.66 49.2 775.86 32.8 749.06 32.8Z M833.01 150.8Z M840.21 45.8C840.21 19 862.81 0 894.61 0C926.41 0 946.41 17.6 946.41 45.6L914.21 45.6C914.21 35.2 906.41 28.8 894.21 28.8C881.01 28.8 872.61 34.8 872.61 44.6C872.61 53.6 877.21 58 887.61 60.2L909.81 64.8C936.21 70.2 948.81 82.8 948.81 106.2C948.81 134.8 926.41 153.4 892.41 153.4C859.41 153.4 838.01 135.6 838.01 107.8L870.21 107.8C870.21 118.6 878.21 124.6 892.61 124.6C907.21 124.6 916.41 118.8 916.41 109.4C916.41 101.2 912.61 97 902.81 95L880.21 90.4C853.81 85 840.21 70 840.21 45.8Z";

/** Source viewBox of the traced wordmark. */
const WORDMARK_W = 948.81;
const WORDMARK_H = 153.4;

interface LogoProps extends React.ComponentProps<"span"> {
  variant?: "mark" | "wordmark" | "full";
  /** Rendered height in px. The wordmark scales from it. */
  size?: number;
}

function Mark({ size }: { size: number }) {
  const id = useId();
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      role="img"
      aria-label="CapyAds"
    >
      <mask id={id}>
        {/* White keeps, black knocks out. */}
        <rect width="48" height="48" rx="13" fill="#fff" />
        <g fill="#000">
          <circle cx="12.6" cy="15.4" r="4.4" />
          <circle cx="35.4" cy="15.4" r="4.4" />
          <rect x="7.5" y="13" width="33" height="27" rx="10.5" />
        </g>
        <g fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round">
          <path d="M14.6 23.6q3 3 6 0" />
          <path d="M27.4 23.6q3 3 6 0" />
        </g>
        <rect x="17.4" y="30" width="13.2" height="6.4" rx="3.2" fill="#fff" />
      </mask>
      <rect width="48" height="48" rx="13" fill="currentColor" mask={`url(#${id})`} />
    </svg>
  );
}

function Wordmark({ size }: { size: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={Math.round((WORDMARK_W / WORDMARK_H) * size)}
      height={size}
      viewBox={`0 0 ${WORDMARK_W} ${WORDMARK_H}`}
      role="img"
      aria-label="CapyAds"
      fill="currentColor"
    >
      <path d={WORDMARK_PATH} />
    </svg>
  );
}

function Logo({ variant = "full", size = 24, className, ...props }: LogoProps) {
  return (
    <span
      data-slot="logo"
      className={cn("inline-flex shrink-0 items-center gap-2.5", className)}
      {...props}
    >
      {variant !== "wordmark" && <Mark size={size} />}
      {/* The wordmark is set in caps, so it reads optically taller than the
          square mark at the same height. 0.62 evens them out. */}
      {variant !== "mark" && <Wordmark size={Math.round(size * 0.62)} />}
    </span>
  );
}

export { Logo };
export type { LogoProps };
