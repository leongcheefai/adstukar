import { economy } from "@repo/config/economy";
import { type Dispatch, type SetStateAction, useEffect, useRef, useState } from "react";
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

export type LookupState = "idle" | "checking" | "ok" | "failed";

/** How long the URL field stays quiet before the site check starts. */
const LOOKUP_DELAY_MS = 600;

const NAME_MAX = economy.slot.nameMaxLength;

/**
 * The site check behind a form that takes a destination URL. It waits for the
 * member to stop typing, and a newer URL stops the check of an older one. It
 * fills a field only when the field is empty or still holds what an earlier
 * check put there, so it never writes over the member's own words or logo.
 *
 * `target` is the normalised URL to check, or "" when there is nothing to
 * check yet.
 */
export function useSiteLookup(
  target: string,
  fields: {
    setName: Dispatch<SetStateAction<string>>;
    setLogoUrl: Dispatch<SetStateAction<string>>;
  },
): LookupState {
  const { setName, setLogoUrl } = fields;
  const [state, setState] = useState<LookupState>("idle");
  /** What the last check put in the form, so a later check may replace it. */
  const filled = useRef({ name: "", logoUrl: "" });

  useEffect(() => {
    if (!target) {
      setState("idle");
      return;
    }
    const stop = new AbortController();
    const wait = setTimeout(() => {
      setState("checking");
      lookUpSite(target, stop.signal)
        .then((site) => {
          if (stop.signal.aborted) return;
          const found = { name: site.name.slice(0, NAME_MAX), logoUrl: site.logoUrl ?? "" };
          setName((was) => (was === "" || was === filled.current.name ? found.name : was));
          setLogoUrl((was) => (was === "" || was === filled.current.logoUrl ? found.logoUrl : was));
          filled.current = found;
          setState("ok");
        })
        .catch(() => {
          if (!stop.signal.aborted) setState("failed");
        });
    }, LOOKUP_DELAY_MS);
    return () => {
      clearTimeout(wait);
      stop.abort();
    };
  }, [target, setName, setLogoUrl]);

  return state;
}
