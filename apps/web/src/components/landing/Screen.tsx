import { Logo } from "@repo/ui";
import type { LandingSample } from "../../lib/landing/sample";
import { Crawl } from "./Crawl";

/**
 * A CapyTV screen, drawn: the venue's own content full-frame, the bar the
 * app puts along the top, and the crawl on the bottom edge. Every size inside
 * is in container units, so the set is judged at true proportions whether it
 * is a hero or a card. Decorative as a whole; the caption beside it carries
 * the meaning.
 */
export function Screen({
  sample,
  crawlSeconds,
  className = "",
}: {
  sample: LandingSample;
  crawlSeconds: number;
  className?: string;
}) {
  const { nowPlaying, online, ads } = sample;
  const bars = Array.from({ length: 5 }, (_, i) => i);
  return (
    <div className={`set ${className}`.trim()} aria-hidden="true">
      <div className="set-picture" data-source={nowPlaying.source}>
        <div className="set-glow" />
        <div className="set-bar">
          <span className="set-lockup">
            <Logo aria-hidden="true" />
          </span>
          <span className="set-live">
            <i />
            <b>{online.toLocaleString("en-US")}</b> online
          </span>
        </div>
        <div className="set-now">
          <span className="set-source">{nowPlaying.source}</span>
          <strong className="set-title">{nowPlaying.title}</strong>
          <span className="set-by">{nowPlaying.by}</span>
          <span className="set-eq">
            {bars.map((i) => (
              <i key={i} style={{ ["--i" as string]: i }} />
            ))}
          </span>
        </div>
      </div>
      <Crawl ads={ads} seconds={crawlSeconds} />
    </div>
  );
}
