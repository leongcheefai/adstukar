import { economy } from "@repo/config/economy";

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

/** Bands in one loop. A band with no brand is printed as an open slot. */
export const BANDS_PER_LOOP = economy.slot.count;

/** How long one band takes to cross the frame, from its way in to its way out. */
export const CROSS_MS = 60_000;

/** The lap before anything is measured, matching `--crawl` on the stage. */
export const CRAWL_FALLBACK_MS = 180_000;

/**
 * One lap of the crawl, from the speed a crossing sets. A band is on screen
 * from the moment its leading edge enters to the moment its trailing edge
 * leaves, so it travels the frame and its own width in `crossMs`. The lap is
 * one run at that speed: it grows with the run, and the crossing stays put.
 * The band width is the mean, gap included, because no two brands are the
 * same width and the crawl has one speed.
 */
export function lapMs(
  runWidth: number,
  frameWidth: number,
  bands = BANDS_PER_LOOP,
  crossMs = CROSS_MS,
): number {
  if (!(runWidth > 0) || !(frameWidth > 0) || !(bands > 0)) return CRAWL_FALLBACK_MS;
  const travel = frameWidth + runWidth / bands;
  return Math.round((crossMs * runWidth) / travel);
}

/**
 * One loop's bands: the brands first, then `null` for each open slot. A list
 * longer than the loop is cut, so the lap never grows past its twenty bands.
 */
export function bandsForLoop<T>(ads: readonly T[], bands = BANDS_PER_LOOP): (T | null)[] {
  const count = Math.max(0, Math.floor(bands));
  return Array.from({ length: count }, (_, slot) => ads[slot] ?? null);
}
