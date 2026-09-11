import { fetchAd, resolveApiBase, sendBeacon } from "./api";
import { renderCard } from "./card";
import { embedConfig } from "./config";
import { watchViewability } from "./viewability";

export interface MountOptions {
  /** The placement's public key (`pk_…`). */
  key: string;
  /** API origin override for self-hosting; defaults to the build-time origin. */
  api?: string | null;
}

/**
 * Fills one target element with a sponsored card. Idempotent per element: a second call
 * (React StrictMode, a repeated `mountAll`) is a no-op. Renders nothing when the server
 * has no ad, and sends the viewability beacon at most once.
 */
export async function mount(el: HTMLElement, opts: MountOptions): Promise<void> {
  if (el.dataset.adstukarReady === "1") return;
  el.dataset.adstukarReady = "1";

  const api = resolveApiBase(opts.api);
  const res = await fetchAd(api, opts.key);

  el.textContent = "";
  if (!res?.ad) return;

  const card = renderCard(res.ad, res.size);
  el.appendChild(card);

  const { impressionId } = res;
  if (impressionId === null) return;
  watchViewability(card, embedConfig.viewability, () => sendBeacon(api, impressionId, opts.key));
}

/** Mounts every `[data-adstukar-key]` element under `root`. */
export function mountAll(root: ParentNode = document): void {
  for (const el of root.querySelectorAll<HTMLElement>("[data-adstukar-key]")) {
    const key = el.dataset.adstukarKey;
    if (!key) continue;
    void mount(el, { key, api: el.dataset.adstukarApi });
  }
}
