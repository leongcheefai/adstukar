import { economy } from "@repo/config/economy";
import type { LoopBand, SlotAvailability } from "@repo/contracts";
import type { ListingState, SlotState } from "@repo/db/enums";

/**
 * The rules of a slot, and nothing else. A slot is one campaign on one
 * position of the ticker ring for one term at one flat price. The numbers,
 * the price and the term end live in `@repo/config/economy`; the service and
 * the routes read this file for the rest.
 */

/** A live slot holds its position. */
export function isLive(state: SlotState): boolean {
  return state === "booked" || state === "running";
}

/**
 * Only a booking whose term never started gives the charge back. A running
 * slot has held a band on every screen, so it keeps what it paid.
 */
export function canRefund(state: SlotState): boolean {
  return state === "booked";
}

/** What the loop needs to know about one slot. */
export interface LoopSlot {
  position: number;
  state: SlotState;
  /** The campaign may run: it is active, not paused by the member or the system. */
  active: boolean;
  /** Null when the campaign holds no live creative. */
  listingState: ListingState | null;
  name: string;
  tagline: string | null;
  logoUrl: string | null;
  url: string;
}

/**
 * The whole loop, position by position. A running slot on an active campaign
 * with an approved creative prints its brand. Any other live slot is held:
 * paid, so nobody else may take the position, but not on screen. A pause
 * takes the brand off the loop and keeps the position. Everything else is open.
 */
export function loopOf(slots: LoopSlot[]): LoopBand[] {
  const byPosition = new Map(slots.filter((s) => isLive(s.state)).map((s) => [s.position, s]));
  return Array.from({ length: economy.slot.count }, (_, index) => {
    const position = index + 1;
    const slot = byPosition.get(position);
    if (!slot) return { position, kind: "open" };
    if (slot.state !== "running" || !slot.active || slot.listingState !== "approved") {
      return { position, kind: "held" };
    }
    return {
      position,
      kind: "brand",
      name: slot.name,
      tagline: slot.tagline ?? "",
      logoUrl: slot.logoUrl,
      url: slot.url,
    };
  });
}

/** How full the loop is. A live slot is taken, whether or not it prints yet. */
export function availability(slots: { state: SlotState }[]): SlotAvailability {
  const total = economy.slot.count;
  const taken = Math.min(total, slots.filter((s) => isLive(s.state)).length);
  return { total, taken, left: total - taken };
}
