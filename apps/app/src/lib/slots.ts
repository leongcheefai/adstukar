import { economy } from "@repo/config/economy";
import type { CampaignWithListings, Listing } from "@repo/contracts/types";
import { TICKER_ADS } from "../components/capychannel/ads";

/**
 * A slot is one band of the ticker loop, booked by one brand for one term at
 * one flat price. The rules here are pure.
 *
 * TODO: the API has no slot model yet. It still stores a campaign and its
 * listings, so a booking is one campaign with one listing, and three things
 * below are stand-ins until the routes land:
 * - the term starts when the campaign was created, not when the charge lands;
 * - the taken count reads what the ticker prints, not a count from the server;
 * - nothing charges the flat price. The dialog checks the balance and no more;
 * - the position a member picks lives in this browser, keyed by the campaign.
 */

const DAY_MS = 86_400_000;

/** Cuts copy to the length a band shows, with an ellipsis in place of the last character. */
export function clipCopy(text: string, max: number): string {
  const chars = Array.from(text.trim());
  return chars.length <= max
    ? chars.join("")
    : `${chars
        .slice(0, max - 1)
        .join("")
        .trimEnd()}…`;
}

/** The flat price of one term, in points at the peg. */
export const SLOT_PRICE_POINTS = (economy.slot.priceUsdCents * economy.pointsPerUsd) / 100;

export type SlotStatus =
  /** On the ticker now. */
  | "running"
  /** A person has to look at the creative first. */
  | "review"
  /** The member has a step to do: prove the domain, or write the creative. */
  | "action"
  /** A reviewer refused the creative. */
  | "rejected"
  /** Stopped by the member or by the system. */
  | "paused"
  /** The term is over. */
  | "ended";

export interface Slot {
  item: CampaignWithListings;
  /** The creative the slot shows. A booking holds one. */
  listing: Listing | null;
  status: SlotStatus;
  startsAt: Date;
  endsAt: Date;
  /** Whole days left in the term, never below zero. */
  daysLeft: number;
  /** Part of the term that has gone, from 0 to 1. */
  elapsed: number;
}

/** The day a term ends when it starts at `from`. A booking made now runs to this day. */
export function termEnd(from = new Date()): Date {
  return new Date(from.getTime() + economy.slot.termDays * DAY_MS);
}

/** The creative a slot shows: the one that runs, else the newest the member wrote. */
function creativeOf(listings: Listing[]): Listing | null {
  const live = listings.filter((l) => l.state !== "archived");
  return live.find((l) => l.state === "approved") ?? live[live.length - 1] ?? null;
}

function statusOf(item: CampaignWithListings, listing: Listing | null, ended: boolean): SlotStatus {
  if (ended) return "ended";
  if (!listing || item.campaign.verifiedAt === null) return "action";
  if (listing.state === "rejected") return "rejected";
  if (listing.state === "pending") return "review";
  if (item.campaign.state === "paused" || listing.state === "paused") return "paused";
  return item.campaign.state === "active" ? "running" : "action";
}

export function slotOf(item: CampaignWithListings, now = new Date()): Slot {
  const listing = creativeOf(item.listings);
  const startsAt = new Date(item.campaign.createdAt);
  const termMs = economy.slot.termDays * DAY_MS;
  const endsAt = new Date(startsAt.getTime() + termMs);
  const leftMs = Math.max(0, endsAt.getTime() - now.getTime());
  return {
    item,
    listing,
    status: statusOf(item, listing, leftMs === 0),
    startsAt,
    endsAt,
    daysLeft: Math.ceil(leftMs / DAY_MS),
    elapsed: Math.min(1, Math.max(0, (now.getTime() - startsAt.getTime()) / termMs)),
  };
}

export interface SlotAvailability {
  total: number;
  taken: number;
  left: number;
}

/**
 * How full the loop is. The member's own live slots count with the brands the
 * ticker already prints, so the page and the ticker never disagree by more
 * than what this member holds.
 */
export function slotAvailability(own: Slot[]): SlotAvailability {
  const total = economy.slot.count;
  const mine = own.filter((slot) => slot.status !== "ended").length;
  const taken = Math.min(total, TICKER_ADS.length + mine);
  return { total, taken, left: total - taken };
}

/** Where a band sits on the loop. The first position is 1, the last is `economy.slot.count`. */
export type SlotPosition = number;

/** One band of the loop as the Campaigns page draws it. */
export type LoopBand =
  | { position: SlotPosition; kind: "open" }
  | {
      position: SlotPosition;
      kind: "brand";
      name: string;
      tagline: string;
      logoUrl: string | null;
      /** The campaign behind a band this member holds. Null on a band of another brand. */
      campaignId: string | null;
    };

const POSITIONS_KEY = "adstukar:slot-positions";

function isPosition(value: unknown): value is SlotPosition {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 1 &&
    value <= economy.slot.count
  );
}

/** The positions this member picked, by campaign id. */
export function readSlotPositions(): Record<string, SlotPosition> {
  try {
    const raw = localStorage.getItem(POSITIONS_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const out: Record<string, SlotPosition> = {};
    for (const [id, position] of Object.entries(parsed)) {
      if (isPosition(position)) out[id] = position;
    }
    return out;
  } catch {
    return {};
  }
}

export function writeSlotPosition(campaignId: string, position: SlotPosition) {
  try {
    const next = { ...readSlotPositions(), [campaignId]: position };
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(next));
  } catch {
    // Private mode: the slot takes the first open position on the next visit.
  }
}

/**
 * The whole loop, position by position. The brands the ticker already prints
 * hold the first positions. A member's live slot takes the position the member
 * picked. A slot with no pick, or with a pick somebody else holds, takes the
 * first open position, so every live slot is always on the loop.
 */
export function loopOf(own: Slot[], picks: Record<string, SlotPosition>): LoopBand[] {
  const bands: LoopBand[] = Array.from({ length: economy.slot.count }, (_, index) => {
    const position = index + 1;
    const ad = TICKER_ADS[index];
    return ad
      ? {
          position,
          kind: "brand",
          name: ad.name,
          tagline: ad.head,
          logoUrl: ad.logo ?? null,
          campaignId: null,
        }
      : { position, kind: "open" };
  });

  const live = own.filter((slot) => slot.status !== "ended");
  const place = (slot: Slot, position: SlotPosition) => {
    bands[position - 1] = {
      position,
      kind: "brand",
      name: slot.item.campaign.name,
      tagline: slot.listing?.tagline ?? "",
      logoUrl: slot.listing?.logoUrl ?? null,
      campaignId: slot.item.campaign.id,
    };
  };

  const unplaced: Slot[] = [];
  for (const slot of live) {
    const pick = picks[slot.item.campaign.id];
    if (pick !== undefined && bands[pick - 1]?.kind === "open") place(slot, pick);
    else unplaced.push(slot);
  }
  for (const slot of unplaced) {
    const open = bands.find((band) => band.kind === "open");
    if (open) place(slot, open.position);
  }
  return bands;
}

/** The first position nobody holds, or null when the loop is full. */
export function firstOpenPosition(bands: LoopBand[]): SlotPosition | null {
  return bands.find((band) => band.kind === "open")?.position ?? null;
}
