import { DAY_MS, economy } from "@repo/config/economy";
import type { Listing, LoopBand, SlotWithCampaign } from "@repo/contracts/types";

/**
 * How the dashboard reads one booking. The API holds the slot, its position
 * and its term; this file only turns a row into what a page shows.
 */

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
  | "ended"
  /** The charge came back before the term started. */
  | "refunded";

export interface Slot {
  item: SlotWithCampaign;
  /** The creative the slot shows. A booking holds one. */
  listing: Listing | null;
  status: SlotStatus;
  position: number;
  /** Null until the term starts. */
  startsAt: Date | null;
  endsAt: Date | null;
  /** Whole days left in the term. A term that has not started has the whole term left. */
  daysLeft: number;
  /** Part of the term that has gone, from 0 to 1. */
  elapsed: number;
}

function statusOf(item: SlotWithCampaign): SlotStatus {
  const { slot, campaign, listing } = item;
  if (slot.state === "refunded") return "refunded";
  if (slot.state === "ended") return "ended";
  if (!listing || campaign.verifiedAt === null) return "action";
  if (listing.state === "rejected") return "rejected";
  if (listing.state === "pending") return "review";
  if (campaign.state === "paused" || listing.state === "paused") return "paused";
  return slot.state === "running" && campaign.state === "active" ? "running" : "action";
}

export function slotOf(item: SlotWithCampaign, now = new Date()): Slot {
  const { slot } = item;
  const startsAt = slot.startsAt ? new Date(slot.startsAt) : null;
  const endsAt = slot.endsAt ? new Date(slot.endsAt) : null;
  const termMs = economy.slot.termDays * DAY_MS;
  const leftMs = endsAt ? Math.max(0, endsAt.getTime() - now.getTime()) : termMs;
  return {
    item,
    listing: item.listing,
    status: statusOf(item),
    position: slot.position,
    startsAt,
    endsAt,
    daysLeft: Math.ceil(leftMs / DAY_MS),
    elapsed: startsAt ? Math.min(1, Math.max(0, (now.getTime() - startsAt.getTime()) / termMs)) : 0,
  };
}

/** A slot that no longer holds a position. */
export function isOver(status: SlotStatus): boolean {
  return status === "ended" || status === "refunded";
}

/** Where a band sits on the ring. The first position is 1, the last is `economy.slot.count`. */
export type SlotPosition = number;

/** The first position nobody holds, or null when the loop is full. */
export function firstOpenPosition(bands: LoopBand[]): SlotPosition | null {
  return bands.find((band) => band.kind === "open")?.position ?? null;
}
