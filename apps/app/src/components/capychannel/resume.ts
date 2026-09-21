import { CHANNEL_IDS, type ChannelId } from "./channels/catalog";

const KEY = "capychannel:resume";

export type CapychannelResume = { screen: "play"; channel: ChannelId } | { screen: "pick" };

function isChannelId(value: string): value is ChannelId {
  return (CHANNEL_IDS as readonly string[]).includes(value);
}

export function loadResume(): CapychannelResume | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const screen = (parsed as { screen?: unknown }).screen;
    if (screen === "pick") return { screen: "pick" };
    if (screen === "play") {
      const channel = (parsed as { channel?: unknown }).channel;
      if (typeof channel === "string" && isChannelId(channel)) {
        return { screen: "play", channel };
      }
    }
    return null;
  } catch {
    return null;
  }
}

export function saveResume(resume: CapychannelResume): void {
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
