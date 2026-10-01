import type { RingLap } from "@repo/contracts/types";
import type { QueuedReport } from "./queue";

/**
 * Everything a registered set keeps in the browser. A venue's browser reloads on
 * its own (a power cut, a crashed tab) and must come back registered, still
 * holding its laps and the reports it owes.
 *
 * `localStorage` can throw or be empty (a private window, cleared site data), so
 * every read answers a default. A set that cannot store its key plays unpaid.
 */
const KEYS = {
  key: "capychannel.screen.key",
  laps: "capychannel.screen.laps",
  queue: "capychannel.screen.queue",
} as const;

function read<T>(name: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(name);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(name: string, value: unknown): void {
  try {
    localStorage.setItem(name, JSON.stringify(value));
  } catch {
    // A full or blocked store must never stop the set playing.
  }
}

export function loadKey(): string | null {
  return read<string | null>(KEYS.key, null);
}
export function saveKey(key: string): void {
  write(KEYS.key, key);
}

export function loadLaps(): RingLap[] {
  return read<RingLap[]>(KEYS.laps, []);
}
export function saveLaps(laps: RingLap[]): void {
  write(KEYS.laps, laps);
}

export function loadQueue(): QueuedReport[] {
  return read<QueuedReport[]>(KEYS.queue, []);
}
export function saveQueue(queue: QueuedReport[]): void {
  write(KEYS.queue, queue);
}

/** The screen was archived: forget it, so the set goes back to an unpaid set. */
export function clearScreen(): void {
  for (const name of Object.values(KEYS)) {
    try {
      localStorage.removeItem(name);
    } catch {
      // Nothing to forget in a store that cannot be read.
    }
  }
}
