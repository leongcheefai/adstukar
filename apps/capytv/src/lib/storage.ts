import type { QueuedReport } from "./queue";
import type { CachedItem } from "./schedule";

/**
 * Everything CapyTV keeps on the device. A kiosk browser reloads on its own — a
 * power cut, a nightly restart, a crashed tab — and must come back paired, still
 * holding its batch, and still owing the reports it has not sent.
 *
 * `localStorage` can throw or be empty (a private window, cleared site data), so
 * every read answers with a default rather than failing the screen.
 */
const KEYS = {
  deviceKey: "capytv.deviceKey",
  items: "capytv.items",
  queue: "capytv.queue",
  settings: "capytv.settings",
} as const;

export interface Settings {
  /** Where the screen is, for the weather. Null until the venue sets it. */
  latitude: number | null;
  longitude: number | null;
  /** A local paper or a community feed. Null until the venue sets one. */
  feedUrl: string | null;
}

export const DEFAULT_SETTINGS: Settings = { latitude: null, longitude: null, feedUrl: null };

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // A full or blocked store must never stop the screen playing.
  }
}

export function loadDeviceKey(): string | null {
  return read<string | null>(KEYS.deviceKey, null);
}
export function saveDeviceKey(key: string | null): void {
  write(KEYS.deviceKey, key);
}

export function loadItems(): CachedItem[] {
  return read<CachedItem[]>(KEYS.items, []);
}
export function saveItems(items: CachedItem[]): void {
  write(KEYS.items, items);
}

export function loadQueue(): QueuedReport[] {
  return read<QueuedReport[]>(KEYS.queue, []);
}
export function saveQueue(queue: QueuedReport[]): void {
  write(KEYS.queue, queue);
}

export function loadSettings(): Settings {
  return { ...DEFAULT_SETTINGS, ...read<Partial<Settings>>(KEYS.settings, {}) };
}
export function saveSettings(settings: Settings): void {
  write(KEYS.settings, settings);
}
