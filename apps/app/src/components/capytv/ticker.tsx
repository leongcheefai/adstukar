import { type FocusEvent, useLayoutEffect, useRef, useState } from "react";
import { TICKER_ADS, type TickerAd, brandOklch } from "./ads";
import { CapyLockup } from "./lockup";
import { CRAWL_MS, copiesForFrame, crawlTimeMs } from "./ticker-math";

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
        <span className="ad-title">{ad.name}</span> <span className="ad-tagline">{ad.head}</span>
      </span>
    </a>
  );
}

function Run({ dup }: { dup: boolean }) {
  return (
    <>
      {TICKER_ADS.map((ad) => (
        <Item key={`${ad.id}-${dup ? "dup" : "live"}`} ad={ad} dup={dup} />
      ))}
    </>
  );
}

export function Ticker() {
  const windowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);
  const runWidthRef = useRef(0);

  useLayoutEffect(() => {
    const track = trackRef.current;
    const frame = windowRef.current;
    if (!track || !frame) return;
    const runW = track.scrollWidth / copies;
    runWidthRef.current = runW;
    const next = copiesForFrame(runW, frame.clientWidth);
    if (next !== copies) setCopies(next);
  }, [copies]);

  function onFocusIn(event: FocusEvent<HTMLDivElement>) {
    const ad = (event.target as HTMLElement).closest(".ticker-item");
    const track = trackRef.current;
    if (!ad || !track || !(ad instanceof HTMLElement)) return;
    const [crawl] = track.getAnimations();
    if (!crawl) return;
    const first = track.firstElementChild;
    if (!(first instanceof HTMLElement)) return;
    const offset = ad.offsetLeft - first.offsetLeft;
    const timing = crawl.effect?.getTiming();
    const duration = typeof timing?.duration === "number" ? timing.duration : CRAWL_MS;
    crawl.currentTime = crawlTimeMs(offset, runWidthRef.current, duration);
  }

  const extras = Math.max(0, copies - 1);

  return (
    <div className="capytv-ad-layer">
      <div className="v-ticker" style={{ ["--copies" as string]: String(copies) }}>
        {/* No pill on the bar: the crawl itself says the channel is live. */}
        <span className="ad-chip">
          <CapyLockup variant="off-air" />
        </span>
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
