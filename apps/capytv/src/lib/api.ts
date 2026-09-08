import { economy } from "@repo/config/economy";
import type { LoopResponse } from "@repo/contracts/types";
import { env } from "./env";
import type { QueuedReport } from "./queue";
import type { CachedItem } from "./schedule";

/**
 * The only two calls CapyTV makes. Both are public and carry the device key as
 * their whole credential — there is no session on a screen.
 *
 * A report that cannot be sent is not lost: it waits in the queue, which lives
 * in `localStorage` and survives the reload. That is why there is no beacon on
 * the way out.
 */

export class PairingError extends Error {}

/** Takes a batch of plays. The screen holds it and reports each one as it goes. */
export async function fetchLoop(key: string, signal?: AbortSignal): Promise<CachedItem[]> {
  const url = new URL("/loop", env.VITE_API_URL);
  url.searchParams.set("key", key);
  url.searchParams.set("size", String(economy.loop.size));

  const res = await fetch(url, { signal, cache: "no-store" });
  // The key is wrong or the screen was archived. Nothing to retry.
  if (res.status === 404) throw new PairingError("This screen is not paired.");
  if (!res.ok) throw new Error(`Loop failed (${res.status})`);
  const body = (await res.json()) as LoopResponse;
  return body.items;
}

/**
 * Reports one play. The body goes as text/plain, the one content type a beacon
 * could also send, so the API parses it by hand and the route stays usable from
 * a page being torn down.
 */
export async function sendReport(key: string, report: QueuedReport): Promise<boolean> {
  const res = await fetch(new URL("/report", env.VITE_API_URL), {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ playId: report.playId, key, playedAt: report.playedAt }),
  });
  return res.ok;
}
