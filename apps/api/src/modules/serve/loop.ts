import { economy } from "@repo/config/economy";
import { rankCandidates } from "./ranking";

/**
 * The cached loop. A screen in a café keeps its network for as long as the café
 * does, so CapyTV takes a batch of plays up front, shows them one at a time, and
 * reports each one when it can. Everything here is pure: the service fetches the
 * rows, this file decides what order they play in.
 */

/** Which path opened a play. It sets how long the play stays reportable. */
export type PlaySource = "serve" | "loop";

export interface LoopPlacement {
  id: string;
  lastPlayedAt: Date | null;
}

export interface LoopCandidate {
  listingId: string;
  lastPlayedAt: Date | null;
}

export interface LoopStep {
  placementId: string;
  /** null is a house play: the distributor's promotion, or the CapyAds card. */
  listingId: string | null;
}

export interface PlanLoopInput {
  placements: LoopPlacement[];
  /** The listings each region may show, keyed by placement id. */
  candidatesByPlacement: Record<string, LoopCandidate[]>;
  size: number;
}

/**
 * Lays out the next `size` plays for one device.
 *
 * The regions take turns, starting with the one that has waited longest, because
 * a device shows one paid listing at a time and a region left out of the batch
 * would go dark for the whole loop. Inside a region the least recently played
 * listing leads, and playing it moves it to the back, so a batch spreads over the
 * eligible creatives instead of repeating the freshest one.
 */
export function planLoop(input: PlanLoopInput): LoopStep[] {
  const order = rankCandidates(input.placements);
  if (order.length === 0 || input.size <= 0) return [];

  // One rotating queue per region. Taking from the front and pushing to the back
  // is what spreads a batch over the creatives.
  const queues = new Map<string, string[]>(
    order.map((placement) => [
      placement.id,
      rankCandidates(input.candidatesByPlacement[placement.id] ?? []).map((c) => c.listingId),
    ]),
  );

  const steps: LoopStep[] = [];
  for (let index = 0; index < input.size; index++) {
    const placement = order[index % order.length];
    if (!placement) break;
    const queue = queues.get(placement.id) ?? [];
    const listingId = queue.shift() ?? null;
    if (listingId !== null) queue.push(listingId);
    steps.push({ placementId: placement.id, listingId });
  }
  return steps;
}

/**
 * The moment a play stops being reportable. A live serve gives minutes, because
 * the screen is on the network right now. A cached loop gives hours, because the
 * screen may report the whole batch only when the network returns.
 */
export function expiresAtFor(source: PlaySource, now: Date): Date {
  const minutes = source === "loop" ? economy.loop.playTtlMinutes : economy.playTtlMinutes;
  return new Date(now.getTime() + minutes * 60_000);
}

export interface ClampReportedAtInput {
  /** What the device says. A live report sends none and means "now". */
  playedAt: Date | null;
  openedAt: Date;
  now: Date;
}

/**
 * When a play actually happened. A queued report carries its own moment so a day
 * of plays lands on the day it played, but the device is the untrusted side of
 * this call: a moment before the play opened or after this instant is a device
 * moving its own history, so the window closes on it.
 */
export function clampReportedAt(input: ClampReportedAtInput): Date {
  if (!input.playedAt || Number.isNaN(input.playedAt.getTime())) return input.now;
  if (input.playedAt < input.openedAt) return input.openedAt;
  if (input.playedAt > input.now) return input.now;
  return input.playedAt;
}
