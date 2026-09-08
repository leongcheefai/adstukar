import type { LoopItem } from "@repo/contracts/types";

/**
 * What the screen shows next, out of the batch it is holding. Pure: the component
 * owns the timers, this file owns the rules.
 */

export type CachedItem = LoopItem;

/** The plays the server would still count. An expired one earns nothing. */
export function playable(items: CachedItem[], now: Date): CachedItem[] {
  return items.filter((item) => new Date(item.expiresAt) > now);
}

/** The next play worth showing, or null when the whole batch went stale. */
export function nextItem(items: CachedItem[], now: Date): CachedItem | null {
  return playable(items, now)[0] ?? null;
}

/**
 * When the screen may show the next play: the dwell this one holds, and then the
 * device's quiet gap. Only one paid listing is on screen at a time, so the gap is
 * quiet time on the whole screen and not on one region.
 */
export function dueAt(startedAt: Date, timing: { dwellSeconds: number; gapSeconds: number }): Date {
  return new Date(startedAt.getTime() + (timing.dwellSeconds + timing.gapSeconds) * 1000);
}
