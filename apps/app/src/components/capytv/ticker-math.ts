/**
 * How many printed runs keep one lap of travel covering the frame.
 *
 * Two copies is the usual marquee trick, and it is only right when one run is
 * already wider than the frame. Four ads are not: the lap would end on a strip
 * of empty black. Repeat until one run's worth of travel still leaves the
 * frame covered.
 */
export function copiesForFrame(runWidth: number, frameWidth: number): number {
  if (!(runWidth > 0) || !(frameWidth >= 0)) return 2;
  return Math.max(2, Math.ceil(frameWidth / runWidth) + 1);
}

/**
 * Animation currentTime that puts an ad at `offsetInRun` on the left of the
 * frame. The crawl is wound by its own clock rather than by animation-delay:
 * a delay is a phase shift on top of however long the animation has already
 * been running.
 */
export function crawlTimeMs(offsetInRun: number, runWidth: number, durationMs: number): number {
  if (!(runWidth > 0) || !(durationMs > 0)) return 0;
  const at = offsetInRun / runWidth;
  const phase = ((at % 1) + 1) % 1;
  return phase * durationMs;
}

/** One lap of the crawl, matching `--crawl` on the stage. */
export const CRAWL_MS = 52_000;
