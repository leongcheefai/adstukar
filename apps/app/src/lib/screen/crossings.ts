/**
 * When a brand crossing the crawl counts as a play (docs/adr/0016). The set feeds
 * this the sightings an IntersectionObserver reports; it answers which positions
 * finished a crossing. Pure, so the rules run without a browser.
 *
 * A band may be printed more than once (the crawl repeats its run to fill the
 * frame), and at the end of each lap one copy jumps out as another jumps in. So a
 * position is "in frame" while any copy of it is, and only a change in that, after
 * a whole batch of sightings, is an enter or a leave.
 */

export type Side = "left" | "right";

export interface Sighting {
  position: number;
  inFrame: boolean;
  /** Which half of the frame the copy's centre was in when it was seen. */
  side: Side;
}

interface Open {
  enteredAt: number;
  /** The page was hidden at some point of this crossing. */
  spoiled: boolean;
}

export interface Tracker {
  /** Copies of each position in the frame now. */
  inFrame: ReadonlyMap<number, number>;
  /** Positions that entered on the right while the page was visible. */
  open: ReadonlyMap<number, Open>;
}

export function emptyTracker(): Tracker {
  return { inFrame: new Map(), open: new Map() };
}

/**
 * Applies one observer callback's sightings. A position counts when it entered on
 * the right while visible, left on the left, was never hidden in between, and
 * took at least `minMs` to cross: a crawl that jumps (a resize, a keyboard wind)
 * is not a crossing anybody watched.
 */
export function track(
  tracker: Tracker,
  sightings: Sighting[],
  at: number,
  visible: boolean,
  minMs: number,
): { tracker: Tracker; counted: number[] } {
  const inFrame = new Map(tracker.inFrame);
  const open = new Map(tracker.open);
  const before = new Map<number, number>();
  const sides = new Map<number, { entered?: Side; left?: Side }>();

  for (const s of sightings) {
    if (!before.has(s.position)) before.set(s.position, inFrame.get(s.position) ?? 0);
    inFrame.set(s.position, Math.max(0, (inFrame.get(s.position) ?? 0) + (s.inFrame ? 1 : -1)));
    const seen = sides.get(s.position) ?? {};
    if (s.inFrame) seen.entered = s.side;
    else seen.left = s.side;
    sides.set(s.position, seen);
  }

  const counted: number[] = [];
  for (const [position, was] of before) {
    const now = inFrame.get(position) ?? 0;
    const seen = sides.get(position) ?? {};
    if (was === 0 && now > 0) {
      if (seen.entered === "right" && visible) {
        open.set(position, { enteredAt: at, spoiled: false });
      } else {
        open.delete(position);
      }
    } else if (was > 0 && now === 0) {
      const crossing = open.get(position);
      open.delete(position);
      if (
        crossing &&
        !crossing.spoiled &&
        seen.left === "left" &&
        at - crossing.enteredAt >= minMs
      ) {
        counted.push(position);
      }
    }
  }
  return { tracker: { inFrame, open }, counted };
}

/** The page went hidden: no crossing in progress may count. */
export function spoilAll(tracker: Tracker): Tracker {
  const open = new Map<number, Open>();
  for (const [position, crossing] of tracker.open) {
    open.set(position, { ...crossing, spoiled: true });
  }
  return { inFrame: tracker.inFrame, open };
}

/** The half of the frame a box's centre sits in. */
export function sideOf(
  rect: { left: number; right: number },
  root: { left: number; right: number },
): Side {
  return (rect.left + rect.right) / 2 < (root.left + root.right) / 2 ? "left" : "right";
}
