/**
 * Pure ranking step. This is the extension point for AI matching: swap the body of
 * `rankCandidates` and nothing else in the serve path changes.
 */
export interface Candidate {
  listingId: string;
  campaignId: string;
  userId: string;
  /** The campaign's name. A listing carries no name of its own. */
  name: string;
  tagline: string;
  logoUrl: string | null;
  lastPlayedAt: Date | null;
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

/** Least recently played on this placement first; never-played listings lead. */
export function rankCandidates<T extends { lastPlayedAt: Date | null }>(candidates: T[]): T[] {
  return [...candidates].sort((a, b) => {
    if (a.lastPlayedAt === null && b.lastPlayedAt === null) return 0;
    if (a.lastPlayedAt === null) return -1;
    if (b.lastPlayedAt === null) return 1;
    return a.lastPlayedAt.getTime() - b.lastPlayedAt.getTime();
  });
}

/**
 * The placement a device fills next: the one that has waited longest. A device
 * holds several regions but shows one paid listing at a time, so the serve call
 * answers with exactly one of them.
 */
export function nextPlacement<T extends { lastPlayedAt: Date | null }>(placements: T[]): T | null {
  return rankCandidates(placements)[0] ?? null;
}
