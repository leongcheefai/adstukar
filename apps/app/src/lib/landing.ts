import { env } from "./env";

const LOOPBACK = new Set(["localhost", "127.0.0.1", "[::1]"]);

/**
 * Where the set sends a signed-out visitor: the landing page, with `from=app`
 * so the landing page does not send them straight back. Null when there is
 * nowhere real to send them, and the set shows its own login form instead:
 *
 * - the landing URL is this page's own origin, so a redirect would loop;
 * - the landing URL is a loopback host and this page is not, which is a
 *   production build made without `VITE_WEB_URL` (the default is localhost).
 */
export function landingUrl(
  webUrl: string = env.VITE_WEB_URL,
  here: string = window.location.href,
): string | null {
  let web: URL;
  let page: URL;
  try {
    web = new URL(webUrl);
    page = new URL(here);
  } catch {
    return null;
  }
  if (web.origin === page.origin) return null;
  if (LOOPBACK.has(web.hostname) && !LOOPBACK.has(page.hostname)) return null;
  return `${web.origin}/?from=app`;
}
