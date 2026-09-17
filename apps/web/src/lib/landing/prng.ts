/**
 * Seeded randomness for the landing page. Every sample number on the page
 * comes from here, so the same seed always draws the same page. Nothing in the
 * render path may call Math.random.
 */

export interface Rng {
  /** Uniform in [0, 1). */
  next(): number;
  /** Integer in [min, max], both ends included. */
  int(min: number, max: number): number;
  /** Float in [min, max). */
  float(min: number, max: number): number;
  pick<T>(items: readonly T[]): T;
  /** A new array, shuffled. The input is not touched. */
  shuffle<T>(items: readonly T[]): T[];
}

/** mulberry32: small, fast, and good enough for a page of sample data. */
export function rng(seed: number): Rng {
  let a = seed >>> 0;
  const next = (): number => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1));
  return {
    next,
    int,
    float: (min, max) => min + next() * (max - min),
    pick: (items) => items[int(0, items.length - 1)] as (typeof items)[number],
    shuffle: (items) => {
      const out = [...items];
      for (let i = out.length - 1; i > 0; i--) {
        const j = int(0, i);
        const tmp = out[i] as (typeof out)[number];
        out[i] = out[j] as (typeof out)[number];
        out[j] = tmp;
      }
      return out;
    },
  };
}

/** The seed space. Nine digits read well in the lab and fit an int32. */
export const SEED_MAX = 999_999_999;

/**
 * A fresh seed for the lab. This is the one place the page may be
 * unpredictable, and it runs on a click, never during a render.
 */
export function randomSeed(): number {
  return Math.floor(Math.random() * (SEED_MAX + 1));
}
