/**
 * Pure ranking step. This is the extension point for AI matching: swap the body of
 * `rankCandidates` and nothing else in the serve path changes.
 */
export interface Candidate {
  productId: string;
  userId: string;
  name: string;
  tagline: string;
  lastServedAt: Date | null;
}

/** True when any excluded phrase appears inside `name + tagline` (case-insensitive). */
export function matchesExcludedTerm(name: string, tagline: string, phrases: string[]): boolean {
  if (phrases.length === 0) return false;
  const haystack = `${name} ${tagline}`.toLowerCase();
  return phrases.some((phrase) => {
    const needle = phrase.trim().toLowerCase();
    return needle.length > 0 && haystack.includes(needle);
  });
}

/** Least recently served to this placement first; never-served products lead. */
export function rankCandidates<T extends { lastServedAt: Date | null }>(candidates: T[]): T[] {
  return [...candidates].sort((a, b) => {
    if (a.lastServedAt === null && b.lastServedAt === null) return 0;
    if (a.lastServedAt === null) return -1;
    if (b.lastServedAt === null) return 1;
    return a.lastServedAt.getTime() - b.lastServedAt.getTime();
  });
}

/** Returns true when the house ad wins the roll for this request. */
export function rollHouseAd(houseAdPct: number, random: () => number = Math.random): boolean {
  if (houseAdPct <= 0) return false;
  if (houseAdPct >= 100) return true;
  return random() * 100 < houseAdPct;
}
