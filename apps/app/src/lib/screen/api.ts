import type { RingResponse } from "@repo/contracts/types";
import { env } from "../env";
import type { QueuedReport } from "./queue";

/**
 * The two calls a registered set makes. Both are public and carry the device key
 * as their whole credential, with no cookie, so a set plays on with no session.
 */

/** The key is unknown or the screen was archived. Nothing to retry. */
export class UnknownScreenError extends Error {}

/** Takes a batch of laps. Zero laps is a status check: the review state, and no play opens. */
export async function fetchRing(key: string, laps?: number): Promise<RingResponse> {
  const url = new URL("/ring", env.VITE_API_URL);
  url.searchParams.set("key", key);
  if (laps !== undefined) url.searchParams.set("laps", String(laps));
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) throw new UnknownScreenError("This screen is not registered.");
  if (!res.ok) throw new Error(`Ring failed (${res.status})`);
  return (await res.json()) as RingResponse;
}

/**
 * Reports one crossing. The body goes as text/plain, the one content type a
 * beacon can also send, so the API parses it by hand.
 */
export async function sendReport(key: string, report: QueuedReport): Promise<boolean> {
  const res = await fetch(new URL("/report", env.VITE_API_URL), {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body: JSON.stringify({ playId: report.playId, key, playedAt: report.playedAt }),
  });
  return res.ok;
}
