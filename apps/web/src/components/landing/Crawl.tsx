import type { SampleAd } from "../../lib/landing/sample";

/**
 * The crawl: one line of listings on a black strap, the way CapyTV draws it.
 * It lives inside the drawn set only, sized in container units so it scales
 * with the set; the site's own strap is `Ticker`. Every listing keeps its own
 * hue; the brand stays off the strap. Decorative: the copy is invented, so the
 * whole strap is hidden from assistive technology.
 */
export interface CrawlProps {
  ads: readonly SampleAd[];
  seconds: number;
}

/** Enough printed runs that one lap still covers a wide frame at three listings. */
const COPIES = 6;
const COPY_IDS = Array.from({ length: COPIES }, (_, i) => i);

function Run({ ads, copy }: { ads: readonly SampleAd[]; copy: number }) {
  return (
    <>
      {ads.map((ad) => (
        <span key={`${ad.name}-${copy}`} className="crawl-item">
          <span
            className="crawl-mark"
            style={{ ["--brand" as string]: `oklch(0.80 0.16 ${ad.hue})` }}
          >
            {ad.mark}
          </span>
          <span className="crawl-copy">
            <span className="crawl-title">{ad.name}</span>
            <span className="crawl-tagline">{ad.head}</span>
          </span>
        </span>
      ))}
    </>
  );
}

export function Crawl({ ads, seconds }: CrawlProps) {
  return (
    <div
      className="crawl"
      aria-hidden="true"
      style={{ ["--copies" as string]: COPIES, ["--crawl-s" as string]: `${seconds}s` }}
    >
      <div className="crawl-window">
        <div className="crawl-track">
          {COPY_IDS.map((copy) => (
            <Run key={copy} ads={ads} copy={copy} />
          ))}
        </div>
      </div>
    </div>
  );
}
