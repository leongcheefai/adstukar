import type { ServeResponse, ServedAd } from "./types";

/** Trims the override, drops any trailing slash, and falls back to the build-time origin. */
export function resolveApiBase(override?: string | null): string {
  const base = (override ?? "").trim() || __ADSTUKAR_API__;
  return base.replace(/\/+$/, "");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

/** `undefined` means "malformed"; `null` is a legitimate empty slot. */
function parseAd(value: unknown): ServedAd | null | undefined {
  if (value === null) return null;
  if (!isRecord(value)) return undefined;
  const { name, tagline, logoUrl, clickUrl } = value;
  if (typeof name !== "string" || typeof tagline !== "string") return undefined;
  if (!isNullableString(logoUrl) || typeof clickUrl !== "string") return undefined;
  return { name, tagline, logoUrl, clickUrl };
}

/** Structural check of the `/serve` payload. Hand-written so the snippet ships no validator. */
export function parseServeResponse(json: unknown): ServeResponse | null {
  if (!isRecord(json)) return null;
  const { impressionId, size, house } = json;
  if (!isNullableString(impressionId)) return null;
  if (size !== "small" && size !== "medium") return null;
  if (typeof house !== "boolean") return null;
  const ad = parseAd(json.ad);
  if (ad === undefined) return null;
  return { impressionId, size, house, ad };
}

export async function fetchAd(api: string, key: string): Promise<ServeResponse | null> {
  try {
    const res = await fetch(`${api}/serve?key=${encodeURIComponent(key)}`, {
      credentials: "omit",
      mode: "cors",
    });
    if (!res.ok) return null;
    return parseServeResponse(await res.json());
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget viewability beacon. The body is a plain string so `sendBeacon` sends it as
 * `text/plain` — the only CORS-safelisted type it allows — and the API reads it as JSON.
 */
export function sendBeacon(api: string, impressionId: string, key: string): void {
  const url = `${api}/beacon`;
  const body = JSON.stringify({ impressionId, key });
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    try {
      if (navigator.sendBeacon(url, body)) return;
    } catch {
      // Fall through to fetch.
    }
  }
  fetch(url, {
    method: "POST",
    body,
    keepalive: true,
    credentials: "omit",
    mode: "cors",
    headers: { "content-type": "text/plain" },
  }).catch(() => undefined);
}
