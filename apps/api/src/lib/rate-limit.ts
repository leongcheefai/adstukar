/**
 * In-memory sliding-window rate limiter. One process, one map — enough for v1 on a
 * single Railway instance. Swap the store for Redis when the API scales out.
 */
export interface RateLimiter {
  /** Returns true when the call is allowed and records it; false when over the limit. */
  hit(key: string, now?: number): boolean;
  /** Drops windows that have fully expired. Called from hit() opportunistically. */
  prune(now?: number): void;
}

export function createRateLimiter({
  limit,
  windowMs,
}: {
  limit: number;
  windowMs: number;
}): RateLimiter {
  const buckets = new Map<string, number[]>();
  let lastPrune = 0;

  function prune(now = Date.now()) {
    const cutoff = now - windowMs;
    for (const [key, times] of buckets) {
      const kept = times.filter((t) => t > cutoff);
      if (kept.length === 0) buckets.delete(key);
      else buckets.set(key, kept);
    }
    lastPrune = now;
  }

  function hit(key: string, now = Date.now()): boolean {
    if (now - lastPrune > windowMs) prune(now);
    const cutoff = now - windowMs;
    const times = (buckets.get(key) ?? []).filter((t) => t > cutoff);
    if (times.length >= limit) {
      buckets.set(key, times);
      return false;
    }
    times.push(now);
    buckets.set(key, times);
    return true;
  }

  return { hit, prune };
}
