import { randomBytes } from "node:crypto";

export function generateApiKey(): string {
  return `pk_${randomBytes(16).toString("hex")}`;
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
