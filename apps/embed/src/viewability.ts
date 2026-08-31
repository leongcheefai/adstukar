export interface ViewabilityOptions {
  /** Fraction of the element that must be visible. */
  minRatio: number;
  /** Milliseconds the element must stay at or above `minRatio`. */
  minMs: number;
}

export interface ViewabilityTracker {
  /**
   * Feeds the latest visible ratio at time `now`. Returns `true` exactly once: on the first
   * call where the ratio has stayed at or above `minRatio` for at least `minMs`. A dip below
   * the ratio resets the clock.
   */
  update(ratio: number, now: number): boolean;
}

/** Pure state machine — no timers, no DOM — so the rule is unit-testable. */
export function createViewabilityTracker({
  minRatio,
  minMs,
}: ViewabilityOptions): ViewabilityTracker {
  let visibleSince: number | null = null;
  let fired = false;
  return {
    update(ratio, now) {
      if (fired) return false;
      if (ratio < minRatio) {
        visibleSince = null;
        return false;
      }
      if (visibleSince === null) visibleSince = now;
      if (now - visibleSince < minMs) return false;
      fired = true;
      return true;
    },
  };
}

/**
 * Wires the tracker to an `IntersectionObserver` plus a timer, so `onViewable` fires as soon
 * as `minMs` elapses while the element is visible — not only on the next intersection event.
 * Returns a disconnect function. Without `IntersectionObserver` it never fires.
 */
export function watchViewability(
  el: Element,
  opts: ViewabilityOptions,
  onViewable: () => void,
): () => void {
  if (typeof IntersectionObserver === "undefined") return () => undefined;

  const tracker = createViewabilityTracker(opts);
  let ratio = 0;
  let visibleAt = 0;
  let timer: ReturnType<typeof setTimeout> | undefined;

  const clearTimer = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  const stop = () => {
    clearTimer();
    observer.disconnect();
  };

  const tick = () => {
    timer = undefined;
    const now = Date.now();
    if (tracker.update(ratio, now)) {
      stop();
      onViewable();
      return;
    }
    // Still visible but the timer fired early: wait out the remainder.
    if (ratio >= opts.minRatio) {
      timer = setTimeout(tick, Math.max(1, opts.minMs - (now - visibleAt)));
    }
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const entry = entries[entries.length - 1];
      if (!entry) return;
      const wasVisible = ratio >= opts.minRatio;
      ratio = entry.isIntersecting ? entry.intersectionRatio : 0;
      if (ratio < opts.minRatio) {
        clearTimer();
        tracker.update(ratio, Date.now());
        return;
      }
      if (!wasVisible) visibleAt = Date.now();
      if (timer === undefined) tick();
    },
    { threshold: [0, opts.minRatio, 1] },
  );
  observer.observe(el);

  return stop;
}
