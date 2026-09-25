import { Plus } from "@phosphor-icons/react";
import { economy } from "@repo/config/economy";
import type { LoopBand } from "@repo/contracts/types";
import { type FocusEvent, useLayoutEffect, useRef, useState } from "react";
import { DASHBOARD_WINDOW } from "../../lib/dashboard-tab";
import { clipCopy } from "../../lib/slots";
import { useSlotLoop } from "../../lib/slots-api";
import { CapyLockup, HomeLink } from "./lockup";
import { CRAWL_FALLBACK_MS, copiesForFrame, crawlTimeMs, lapMs } from "./ticker-math";

type BrandBand = Extract<LoopBand, { kind: "brand" }>;

function Mark({ band }: { band: BrandBand }) {
  if (band.logoUrl) {
    return (
      <span className="ad-logo">
        <img src={band.logoUrl} alt="" />
      </span>
    );
  }
  // No logo: the first letter of the name stands in.
  return (
    <span className="ad-avatar" aria-hidden="true">
      {Array.from(band.name.trim())[0] ?? ""}
    </span>
  );
}

function Item({ band, dup }: { band: BrandBand; dup: boolean }) {
  return (
    <a
      className="ticker-item"
      href={band.url}
      target="_blank"
      rel="noopener noreferrer"
      {...(dup ? { inert: true, tabIndex: -1 } : {})}
    >
      <Mark band={band} />
      <span className="ad-copy">
        <span className="ad-title">{clipCopy(band.name, economy.slot.nameMaxLength)}</span>{" "}
        <span className="ad-tagline">{clipCopy(band.tagline, economy.slot.taglineMaxLength)}</span>
      </span>
    </a>
  );
}

/**
 * A band nobody's brand is on: open, or paid for and waiting for review. It
 * keeps the loop its full length, and it opens the page where a member books,
 * in the dashboard's own tab.
 * Sixteen of them would be sixteen tab stops saying the same thing, so only
 * the first takes focus.
 */
function OpenSlot({ dup, first }: { dup: boolean; first: boolean }) {
  return (
    <a
      className="ticker-item ticker-slot"
      href="/dashboard/campaigns/book"
      target={DASHBOARD_WINDOW}
      aria-label="Add your brand"
      {...(dup ? { inert: true, tabIndex: -1 } : first ? {} : { tabIndex: -1 })}
    >
      <Plus weight="bold" aria-hidden="true" />
    </a>
  );
}

/** Twenty open bands, so the bar keeps its length while the loop loads. */
const EMPTY_LOOP: LoopBand[] = Array.from({ length: economy.slot.count }, (_, i) => ({
  position: i + 1,
  kind: "open",
}));

function Run({ bands, dup }: { bands: LoopBand[]; dup: boolean }) {
  const copy = dup ? "dup" : "live";
  const firstOpen = bands.findIndex((band) => band.kind !== "brand");
  return (
    <>
      {bands.map((band, index) =>
        band.kind === "brand" ? (
          <Item key={`${band.position}-${copy}`} band={band} dup={dup} />
        ) : (
          <OpenSlot key={`slot-${band.position}-${copy}`} dup={dup} first={index === firstOpen} />
        ),
      )}
    </>
  );
}

export function Ticker() {
  const { data: loop } = useSlotLoop();
  const bands = loop?.bands ?? EMPTY_LOOP;
  const windowRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [copies, setCopies] = useState(2);
  const [lap, setLap] = useState(CRAWL_FALLBACK_MS);
  const runWidthRef = useRef(0);

  // Measured again whenever either box changes: a logo that loads late, or a
  // loop that arrives from the API, makes the run longer, and the lap has to
  // grow with it or the crossing speeds up.
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
            <Run bands={bands} dup={false} />
            {Array.from({ length: extras }, (_, copy) => (
              <Run key={`dup-${copy + 1}-of-${extras}`} bands={bands} dup />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
