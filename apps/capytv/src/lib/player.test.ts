import { act, createElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { type PlayerState, usePlayer } from "./player";
import type { CachedItem } from "./schedule";
import { loadQueue, saveItems } from "./storage";

/**
 * The screen is a hook with timers, so the test mounts it under jsdom, drives
 * the clock, and reads what the queue owes. The network is down throughout: a
 * screen with no network keeps playing what it holds, and that is what makes the
 * queue the one honest record of what was shown.
 */

const item: CachedItem = {
  playId: "p1",
  format: "band",
  size: "medium",
  dwellSeconds: 5,
  gapSeconds: 30,
  house: false,
  listing: { name: "Brand", tagline: "Tag", logoUrl: null, scanUrl: "https://x.test/s" },
  promotion: null,
  expiresAt: "2099-01-01T00:00:00.000Z",
};

let state: PlayerState | null = null;
let root: ReturnType<typeof createRoot> | null = null;

function Screen(): null {
  state = usePlayer("device-key");
  return null;
}

function setVisibility(value: DocumentVisibilityState): void {
  Object.defineProperty(document, "visibilityState", { value, configurable: true });
  document.dispatchEvent(new Event("visibilitychange"));
}

/**
 * Node 22+ owns a `localStorage` global of its own, undefined without a flag,
 * so the jsdom one never lands. A Map is enough for what the screen keeps.
 */
function installStorage(): void {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  };
  Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
}

async function mount(): Promise<void> {
  root = createRoot(document.createElement("div"));
  await act(async () => {
    root?.render(createElement(Screen));
  });
}

async function advance(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  installStorage();
  vi.useFakeTimers();
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
  Object.defineProperty(document, "visibilityState", { value: "visible", configurable: true });
  saveItems([item]);
});

afterEach(async () => {
  await act(async () => root?.unmount());
  root = null;
  state = null;
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("usePlayer", () => {
  it("owes a report once a play held the screen for its dwell", async () => {
    await mount();
    await advance(item.dwellSeconds * 1000 + 10);
    expect(loadQueue().map((r) => r.playId)).toEqual(["p1"]);
  });

  it("shows nothing and owes nothing while the page is hidden", async () => {
    setVisibility("hidden");
    await mount();
    await advance(item.dwellSeconds * 1000 + 10);
    expect(state?.current).toBeNull();
    expect(loadQueue()).toEqual([]);
  });

  it("drops the play in progress when the page hides, and plays it again when the page returns", async () => {
    await mount();
    await advance(2_000);
    expect(state?.current?.playId).toBe("p1");

    await act(async () => setVisibility("hidden"));
    expect(state?.current).toBeNull();
    await advance(item.dwellSeconds * 1000 + 10);
    expect(loadQueue()).toEqual([]);

    await act(async () => setVisibility("visible"));
    await advance(item.dwellSeconds * 1000 + 10);
    expect(loadQueue().map((r) => r.playId)).toEqual(["p1"]);
  });
});
