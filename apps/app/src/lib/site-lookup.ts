import { domainOf } from "./url";

/**
 * What the booking form can learn from a destination URL, from the browser
 * alone.
 *
 * TODO: this is a stand-in. A browser may not read the HTML of another site,
 * so the page title and the icon a site names in its `<link>` tags are out of
 * reach. The name is a guess from the domain, and the icon is looked for at
 * the two paths most sites serve. An API route that reads the page would give
 * the true title and the true icon.
 */
export interface SiteLookup {
  name: string;
  logoUrl: string | null;
}

/** Where a site most often keeps an icon, largest first. */
const ICON_PATHS = ["/apple-touch-icon.png", "/favicon.ico"];

/** "tinyorder.shop" gives "Tinyorder": the first label of the domain, capital first. */
export function nameFromUrl(url: string): string {
  const label = domainOf(url).split(".")[0] ?? "";
  return label ? label.charAt(0).toUpperCase() + label.slice(1) : "";
}

/** Resolves when the image loads. An image may cross origins where a fetch may not. */
function imageLoads(src: string, signal: AbortSignal): Promise<boolean> {
  return new Promise((resolve) => {
    const image = new Image();
    const finish = (ok: boolean) => {
      image.onload = null;
      image.onerror = null;
      resolve(ok);
    };
    image.onload = () => finish(image.naturalWidth > 0);
    image.onerror = () => finish(false);
    signal.addEventListener("abort", () => finish(false), { once: true });
    image.src = src;
  });
}

/**
 * Checks that the site answers, then reads what it can. It throws when the
 * site does not answer. The response is opaque, so an answer is all it tells:
 * a page that answers with an error still counts.
 */
export async function lookUpSite(url: string, signal: AbortSignal): Promise<SiteLookup> {
  await fetch(url, { mode: "no-cors", signal });

  const origin = new URL(url).origin;
  let logoUrl: string | null = null;
  for (const path of ICON_PATHS) {
    if (await imageLoads(origin + path, signal)) {
      logoUrl = origin + path;
      break;
    }
  }
  return { name: nameFromUrl(url), logoUrl };
}
