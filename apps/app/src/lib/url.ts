/**
 * URL helpers shared by every surface that takes a product link.
 *
 * The API decides what a valid product URL is (`domainFromUrl` in
 * `apps/api/src/lib/domain.ts`). These are the browser-side twins, used to
 * enable a button and to label a field before the request goes out.
 */

/** Accepts "craftlog.app" as readily as the full URL. */
export function normalizeUrl(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function isProbablyUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/** The host without `www.`, or the raw input when it does not parse yet. */
export function domainOf(value: string): string {
  try {
    return new URL(normalizeUrl(value)).hostname.replace(/^www\./, "");
  } catch {
    return value.trim();
  }
}
