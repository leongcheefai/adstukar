import { SOURCE_IDS, type SourceId } from "./sources/catalog";

const KEY = "capytv:resume";

export type CapytvResume = { screen: "play"; source: SourceId } | { screen: "pick" };

function isSourceId(value: string): value is SourceId {
  return (SOURCE_IDS as readonly string[]).includes(value);
}

export function loadResume(): CapytvResume | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const screen = (parsed as { screen?: unknown }).screen;
    if (screen === "pick") return { screen: "pick" };
    if (screen === "play") {
      const source = (parsed as { source?: unknown }).source;
      if (typeof source === "string" && isSourceId(source)) {
        return { screen: "play", source };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function saveResume(resume: CapytvResume): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(resume));
  } catch {
    // Private mode or blocked storage: a visit to Dashboard will cold-boot.
  }
}

export function clearResume(): void {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    // Same as save: nothing we can do if storage is blocked.
  }
}
