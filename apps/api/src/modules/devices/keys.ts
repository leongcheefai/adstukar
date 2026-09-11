import { randomBytes } from "node:crypto";

/** The screen's credential for the serve endpoint. */
export function generateApiKey(): string {
  return `dk_${randomBytes(16).toString("hex")}`;
}

/**
 * The code the screen shows at pairing. Read aloud off a TV across a room, so it
 * uses an alphabet with no 0/O and no 1/I, in two short groups.
 */
const PAIRING_ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateDeviceId(): string {
  const bytes = randomBytes(8);
  const chars = [...bytes].map((b) => PAIRING_ALPHABET[b % PAIRING_ALPHABET.length]);
  return `${chars.slice(0, 4).join("")}-${chars.slice(4, 8).join("")}`;
}

/** Lower-cases, trims, de-duplicates, drops empties. Pure so the dashboard can mirror it. */
export function normalizeTerms(phrases: string[]): string[] {
  const seen = new Set<string>();
  for (const raw of phrases) {
    const phrase = raw.trim().toLowerCase();
    if (phrase) seen.add(phrase);
  }
  return [...seen];
}
