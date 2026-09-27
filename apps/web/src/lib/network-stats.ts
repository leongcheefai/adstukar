import type { NetworkStats } from "@repo/contracts/types";
import { useEffect, useState } from "react";
import { env } from "./env";

/**
 * The network's live figures, for the ticker. `undefined` while the first
 * answer is on its way, `null` when the API cannot be reached: the ticker holds
 * a blank for the one and drops the clause for the other.
 *
 * One poller serves every ticker on the page (the home carries two), and it
 * rests while the tab is hidden. The API caches the figures for 30 seconds, so
 * asking more often would read the same answer.
 */
export type NetworkFigures = NetworkStats | null | undefined;

const POLL_MS = 30_000;

let current: NetworkFigures;
let timer: ReturnType<typeof setTimeout> | undefined;
let inFlight = false;
const listeners = new Set<(figures: NetworkFigures) => void>();

/** Reads the wire by hand: the site imports types only, never the contract's values. */
function parse(body: unknown): NetworkStats | null {
  if (typeof body !== "object" || body === null) return null;
  const { plays, screensOnline } = body as Record<string, unknown>;
  if (typeof plays !== "number" || typeof screensOnline !== "number") return null;
  return { plays, screensOnline };
}

function publish(figures: NetworkFigures) {
  current = figures;
  for (const listener of listeners) listener(figures);
}

async function poll() {
  if (inFlight) return;
  clearTimeout(timer);
  timer = undefined;
  if (listeners.size === 0) return;
  if (document.visibilityState === "visible") {
    inFlight = true;
    try {
      const res = await fetch(`${env.PUBLIC_API_URL}/stats/network`);
      const figures = res.ok ? parse(await res.json()) : null;
      // A blip after a good answer keeps the last figure: a number that
      // vanishes for thirty seconds reads as a broken page.
      publish(figures ?? current ?? null);
    } catch {
      publish(current ?? null);
    } finally {
      inFlight = false;
    }
  }
  if (listeners.size > 0 && timer === undefined) timer = setTimeout(poll, POLL_MS);
}

function onVisible() {
  if (document.visibilityState === "visible") void poll();
}

export function useNetworkStats(): NetworkFigures {
  // Starts blank even when another ticker already holds the figures, so the
  // first client render matches the server's and hydration stays quiet.
  const [figures, setFigures] = useState<NetworkFigures>(undefined);

  useEffect(() => {
    listeners.add(setFigures);
    setFigures(current);
    if (listeners.size === 1) {
      document.addEventListener("visibilitychange", onVisible);
      if (timer === undefined) void poll();
    }
    return () => {
      listeners.delete(setFigures);
      if (listeners.size === 0) {
        document.removeEventListener("visibilitychange", onVisible);
        clearTimeout(timer);
        timer = undefined;
      }
    };
  }, []);

  return figures;
}
