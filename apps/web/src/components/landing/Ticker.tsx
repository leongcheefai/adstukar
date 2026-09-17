import { economy } from "@repo/config/economy";
import { project } from "@repo/config/project";
import { useEffect, useRef, useState } from "react";

/**
 * The site's ticker: one sentence on a black strap, the way CapyTV draws its
 * crawl, but carrying the site's own words and the live network total rather
 * than invented listings. Pure: the figure comes in as a prop.
 *
 * `variant` sets where it lives and therefore its scale:
 *  - foot: fixed to the bottom of the viewport
 *  - hero: the foot of the "On air" hero, in flow
 *
 * The number changes width once, when it lands, so the run holds a blank of
 * the same width until then and the lap does not jump. If the API cannot be
 * reached the clause is dropped: a welcome with no figure is still a welcome,
 * and a dash is a broken page.
 */
export interface TickerProps {
  plays: number | null | undefined;
  variant: "foot" | "hero";
}

/** Enough printed runs that one lap still covers a wide frame at a short sentence. */
const COPIES = 8;
const COPY_IDS = Array.from({ length: COPIES }, (_, i) => i);

/**
 * Reading speed of the run. A lap is one run's travel, so the time follows the
 * width. Slow: the strap is read in passing, not chased across the screen.
 */
const PX_PER_SECOND = 40;
/** Before the run is measured, and on the server. */
const FALLBACK_SECONDS = 40;

const WELCOME = `Welcome to ${project.name}s`;
const PITCH = "Earn while you do your things";
const TOTAL = "Total ads view:";
const ONLINE = "Online users:";
/** Not measured anywhere yet, so the strap carries the brand's own figure. */
const ONLINE_USERS = 2_345;
/** The welcome grant is an economy number, so the strap reads it from there. */
const NEWS = `News: new users receive ${economy.grants.firstListingApproval.toLocaleString("en-US")} ${project.pointsName}`;

function Run({ plays }: { plays: number | null | undefined }) {
  return (
    <span className="ticker-item">
      <span>{WELCOME}</span>
      <span>{PITCH}</span>
      {plays !== null && (
        <span className="ticker-total">
          {TOTAL}{" "}
          <b className="tabular-nums" data-loading={plays === undefined ? "" : undefined}>
            {plays === undefined ? "" : plays.toLocaleString("en-US")}
          </b>
        </span>
      )}
      <span className="ticker-total">
        {ONLINE} <b className="tabular-nums">{ONLINE_USERS.toLocaleString("en-US")}</b>
      </span>
      <span>{NEWS}</span>
    </span>
  );
}

export function Ticker({ plays, variant }: TickerProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [seconds, setSeconds] = useState(FALLBACK_SECONDS);

  // The lap follows the printed width, so a long figure and a narrow phone
  // read at the same speed. Measured, not computed, because the font decides.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const run = track.scrollWidth / COPIES;
      if (run > 0) setSeconds(Math.max(4, run / PX_PER_SECOND));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(track);
    return () => observer.disconnect();
  }, []);

  const online = `${ONLINE} ${ONLINE_USERS.toLocaleString("en-US")}`;
  const sentence =
    typeof plays === "number"
      ? `${WELCOME} ${PITCH} ${TOTAL} ${plays.toLocaleString("en-US")} ${online} ${NEWS}`
      : `${WELCOME} ${PITCH} ${online} ${NEWS}`;

  return (
    <div
      className="ticker"
      data-variant={variant}
      style={{ ["--copies" as string]: COPIES, ["--ticker-s" as string]: `${seconds}s` }}
    >
      {/* Read once, still. The moving copies below are the same words eight
          times over, which is noise to a screen reader. */}
      <p className="sr-only">{sentence}</p>
      <div className="ticker-window" aria-hidden="true">
        <div className="ticker-track" ref={trackRef}>
          {COPY_IDS.map((copy) => (
            <Run key={copy} plays={plays} />
          ))}
        </div>
      </div>
    </div>
  );
}
