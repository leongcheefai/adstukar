import { slotOffer } from "@repo/config/money";
import { project } from "@repo/config/project";
import { useEffect, useRef, useState } from "react";
import type { NetworkFigures } from "../../lib/network-stats";

/**
 * The site's ticker: one sentence on a black strap, the way CapyTV draws its
 * crawl, but carrying the site's own words and the live network figures rather
 * than invented listings. Pure: the figures come in as a prop.
 *
 * `variant` sets where it lives and therefore its scale:
 *  - foot: fixed to the bottom of the viewport
 *  - hero: the foot of the "On air" hero, in flow
 *
 * The numbers change width once, when they land, so the run holds a blank
 * until then and the lap does not jump. If the API cannot be reached both
 * clauses are dropped: a welcome with no figure is still a welcome, and a dash
 * is a broken page.
 */
export interface TickerProps {
  /** `undefined` while loading, `null` when the API cannot be reached. */
  stats: NetworkFigures;
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
const ONLINE = "Screens online:";
/** The slot price is an economy number, so the strap reads it from there. */
const NEWS = `News: a slot on every screen is ${slotOffer()}`;

function Figure({ label, value }: { label: string; value: number | undefined }) {
  return (
    <span className="ticker-total">
      {label}{" "}
      <b className="tabular-nums" data-loading={value === undefined ? "" : undefined}>
        {value === undefined ? "" : value.toLocaleString("en-US")}
      </b>
    </span>
  );
}

function Run({ stats }: { stats: NetworkFigures }) {
  return (
    <span className="ticker-item">
      <span>{WELCOME}</span>
      <span>{PITCH}</span>
      {stats !== null && (
        <>
          <Figure label={TOTAL} value={stats?.plays} />
          <Figure label={ONLINE} value={stats?.screensOnline} />
        </>
      )}
      <span>{NEWS}</span>
    </span>
  );
}

export function Ticker({ stats, variant }: TickerProps) {
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

  const sentence = stats
    ? `${WELCOME} ${PITCH} ${TOTAL} ${stats.plays.toLocaleString("en-US")} ${ONLINE} ${stats.screensOnline.toLocaleString("en-US")} ${NEWS}`
    : `${WELCOME} ${PITCH} ${NEWS}`;

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
            <Run key={copy} stats={stats} />
          ))}
        </div>
      </div>
    </div>
  );
}
