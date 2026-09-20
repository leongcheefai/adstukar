import { Plus } from "@phosphor-icons/react";
import { economy } from "@repo/config/economy";
import { type FocusEvent, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { clipCopy } from "../../lib/slots";
import { TICKER_ADS, type TickerAd, brandOklch } from "./ads";
import { CapyLockup, HomeLink } from "./lockup";
import { CRAWL_FALLBACK_MS, bandsForLoop, copiesForFrame, crawlTimeMs, lapMs } from "./ticker-math";

function Face({ ad }: { ad: TickerAd }) {
  return (
    <span
      className="ad-avatar"
      style={{ ["--brand" as string]: brandOklch(ad.hue) }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {ad.face}
      </svg>
    </span>
  );
}

function Mark({ ad }: { ad: TickerAd }) {
  if (ad.logo) {
    return (
      <span className="ad-logo">
        <img src={ad.logo} alt="" />
      </span>
    );
  }
  return <Face ad={ad} />;
}

function Item({ ad, dup }: { ad: TickerAd; dup: boolean }) {
  return (
    <a
      className="ticker-item"
      href={`https://${ad.url}`}
      target="_blank"
      rel="noopener noreferrer"
      style={{ ["--brand" as string]: brandOklch(ad.hue) }}
      {...(dup ? { inert: true, tabIndex: -1 } : {})}
    >
      <Mark ad={ad} />
      <span className="ad-copy">
        <span className="ad-title">{clipCopy(ad.name, economy.slot.nameMaxLength)}</span>{" "}
        <span className="ad-tagline">{clipCopy(ad.head, economy.slot.taglineMaxLength)}</span>
      </span>
    </a>
  );
}

/**
 * A band nobody has bought. It keeps the loop its full length, and it opens
 * the page where a member books it. Sixteen of them would be sixteen tab stops
 * saying the same thing, so only the first open slot takes focus.
 */
function OpenSlot({ dup, first }: { dup: boolean; first: boolean }) {
  return (
    <Link
      className="ticker-item ticker-slot"
      to="/dashboard/campaigns/book"
      aria-label="Add your brand"
      {...(dup ? { inert: true, tabIndex: -1 } : first ? {} : { tabIndex: -1 })}
    >
      <Plus weight="bold" aria-hidden="true" />
    </Link>
  );
}

const LOOP_BANDS = bandsForLoop(TICKER_ADS);
const FIRST_OPEN_BAND = LOOP_BANDS.indexOf(null);

function Run({ dup }: { dup: boolean }) {
  const copy = dup ? "dup" : "live";
  return (
    <>
      {LOOP_BANDS.map((ad, band) =>
        ad ? (
          <Item key={`${ad.id}-${copy}`} ad={ad} dup={dup} />
        ) : (
          <OpenSlot key={`slot-${band}-${copy}`} dup={dup} first={band === FIRST_OPEN_BAND} />
        ),
      )}
    </>
  );
}

export function Ticker() {
  const windowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);
  const [lap, setLap] = useState(CRAWL_FALLBACK_MS);
  const runWidthRef = useRef(0);

  // Measured again whenever either box changes: a logo that loads late makes
  // the run longer, and the lap has to grow with it or the crossing speeds up.
  useLayoutEffect(() => {
    const track = trackRef.current;
    const frame = windowRef.current;
    if (!track || !frame) return;
    function measure() {
      if (!track || !frame) return;
      const runW = track.scrollWidth / copies;
      runWidthRef.current = runW;
      const next = copiesForFrame(runW, frame.clientWidth);
      if (next !== copies) setCopies(next);
      setLap(lapMs(runW, frame.clientWidth));
    }
    measure();
    const watch = new ResizeObserver(measure);
    watch.observe(track);
    watch.observe(frame);
    return () => watch.disconnect();
  }, [copies]);

  function onFocusIn(event: FocusEvent<HTMLDivElement>) {
    const ad = (event.target as HTMLElement).closest(".ticker-item");
    const track = trackRef.current;
    if (!ad || !track || !(ad instanceof HTMLElement)) return;
    // Keyboard focus only. A press also gives the ad focus, on the way down:
    // winding the crawl then moves the ad out from under the pointer, the
    // release lands on something else, and the browser never sends the click.
    if (!ad.matches(":focus-visible")) return;
    const [crawl] = track.getAnimations();
    if (!crawl) return;
    const first = track.firstElementChild;
    if (!(first instanceof HTMLElement)) return;
    const offset = ad.offsetLeft - first.offsetLeft;
    const timing = crawl.effect?.getTiming();
    const duration = typeof timing?.duration === "number" ? timing.duration : lap;
    crawl.currentTime = crawlTimeMs(offset, runWidthRef.current, duration);
  }

  const extras = Math.max(0, copies - 1);

  return (
    <div className="capychannel-ad-layer">
      <div
        className="v-ticker"
        style={{ ["--copies" as string]: String(copies), ["--crawl" as string]: `${lap}ms` }}
      >
        {/* No pill on the bar: the crawl itself says the channel is live. */}
        <HomeLink className="ad-chip">
          <CapyLockup variant="off-air" />
        </HomeLink>
        <div className="ticker-window" ref={windowRef} onFocusCapture={onFocusIn}>
          <div className="ticker-track" ref={trackRef}>
            <Run dup={false} />
            {Array.from({ length: extras }, (_, copy) => (
              <Run key={`dup-${copy + 1}-of-${extras}`} dup />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
