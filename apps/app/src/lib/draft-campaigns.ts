/**
 * Campaigns that exist in this browser only.
 *
 * There is no campaign table. The API knows products, and a campaign is every
 * product that shares a domain, so a campaign created before its first ad has
 * nothing on the server to live in. It waits here instead, and the server's
 * copy takes over as soon as an ad on the same domain is saved.
 *
 * This is a design-stage placeholder, not the shipping model. It is one
 * browser and one device, and clearing site data removes it.
 */

import { useSyncExternalStore } from "react";

export interface DraftCampaign {
  /** The grouping key, so a draft and a server campaign can never both hold it. */
  domain: string;
  name: string;
  url: string;
  logoUrl: string | null;
  createdAt: string;
}

const KEY = "capyads.draft-campaigns.v1";

/** One frozen array, so an empty snapshot keeps the same reference. */
const EMPTY: readonly DraftCampaign[] = Object.freeze([]);

const listeners = new Set<() => void>();

/**
 * `useSyncExternalStore` compares snapshots by reference, so parsing on every
 * read would loop forever. The parse result is held until a write or another
 * tab changes it.
 */
let cache: readonly DraftCampaign[] | null = null;

function isDraft(value: unknown): value is DraftCampaign {
  if (typeof value !== "object" || value === null) return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.domain === "string" &&
    typeof row.name === "string" &&
    typeof row.url === "string" &&
    (row.logoUrl === null || typeof row.logoUrl === "string") &&
    typeof row.createdAt === "string"
  );
}

function load(): readonly DraftCampaign[] {
  if (typeof window === "undefined") return EMPTY;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    const rows = parsed.filter(isDraft);
    return rows.length > 0 ? rows : EMPTY;
    // Private mode, a full quota and hand-edited JSON all land here. A broken
    // store must cost the member a campaign, never the page.
  } catch {
    return EMPTY;
  }
}

function snapshot(): readonly DraftCampaign[] {
  if (!cache) cache = load();
  return cache;
}

function notify() {
  for (const listener of listeners) listener();
}

function commit(next: readonly DraftCampaign[]) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Out of quota or blocked. The list still holds for this session.
  }
  notify();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

if (typeof window !== "undefined") {
  // A second tab writing the same key. Drop the cache so the next read parses.
  window.addEventListener("storage", (event) => {
    if (event.key !== null && event.key !== KEY) return;
    cache = null;
    notify();
  });
}

/** Adds the campaign, or replaces the draft that already holds its domain. */
export function addDraftCampaign(draft: DraftCampaign): void {
  commit([...snapshot().filter((row) => row.domain !== draft.domain), draft]);
}

export function updateDraftCampaign(
  domain: string,
  patch: Partial<Omit<DraftCampaign, "createdAt">>,
): void {
  const rows = snapshot();
  if (!rows.some((row) => row.domain === domain)) return;
  commit(rows.map((row) => (row.domain === domain ? { ...row, ...patch } : row)));
}

export function removeDraftCampaign(domain: string): void {
  const rows = snapshot();
  const next = rows.filter((row) => row.domain !== domain);
  if (next.length === rows.length) return;
  commit(next.length > 0 ? next : EMPTY);
}

export function useDraftCampaigns(): readonly DraftCampaign[] {
  return useSyncExternalStore(subscribe, snapshot, () => EMPTY);
}
