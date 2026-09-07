/**
 * Extracts the registrable host from a campaign URL: lower-case, no `www.`.
 * Returns null for anything that is not an http(s) URL with a hostname.
 */
export function domainFromUrl(input: string): string | null {
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  if (!host) return null;
  return host;
}
