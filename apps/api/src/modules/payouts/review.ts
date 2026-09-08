import { economy } from "@repo/config/economy";

/**
 * The fraud review an admin reads before each payout batch. The rules are pure;
 * the queries that feed them live in `payouts.service.ts`.
 *
 * CapyTV is a PWA, so there is no device attestation. Approval, the daily play
 * cap, the payout hold and these signals are the whole defence (docs/adr/0003).
 * Every signal here is a flag for a person to weigh, never a refusal.
 */

/** What one device did over the review window. */
export interface DeviceStat {
  deviceId: string;
  /** Counted plays in the window, house cards included. */
  plays: number;
  scans: number;
  /** Counted plays by UTC hour of day. Always 24 entries. */
  playsByHour: number[];
  lastSeenAt: Date | null;
  lastNetwork: string | null;
  location: string;
  /** The hours the venue states it is open, in its own time. Null when unstated. */
  openHour: number | null;
  closeHour: number | null;
}

export interface DeviceFlags {
  scanRatio: number;
  /** Plays enough to judge, and almost nobody scanning. The drawer-tablet signal. */
  lowScanRatio: boolean;
  /** Hours of the day this screen played in. A room that closes does not run 24. */
  activeHours: number;
  /** Plays the screen ran while the venue states it is shut. */
  outOfHoursPlays: number;
  /** Days since the last report, or null when the screen never reported. */
  daysSilent: number | null;
  sharedNetwork: boolean;
  sharedLocation: boolean;
}

/** How the review reads one device against the rest of the estate. */
export interface ReviewContext {
  /** Devices per network prefix, across every member. */
  networkCounts: Map<string, number>;
  /** Devices per normalised address, across every member. */
  locationCounts: Map<string, number>;
  now: Date;
}

/**
 * Plays this screen ran while the venue states it is closed. A room that shuts
 * at six does not play to anybody at three in the morning.
 *
 * `playsByHour` is in the venue's own hours, so no offset is applied here. A
 * window that crosses midnight (20:00 to 04:00) is one stretch, and a venue that
 * states the same hour for both is open around the clock.
 */
export function outOfHoursPlays(
  playsByHour: number[],
  openHour: number | null,
  closeHour: number | null,
): number {
  if (openHour === null || closeHour === null || openHour === closeHour) return 0;
  const open = (hour: number) =>
    openHour < closeHour
      ? hour >= openHour && hour < closeHour
      : hour >= openHour || hour < closeHour;
  return playsByHour.reduce((sum, plays, hour) => (open(hour) ? sum : sum + plays), 0);
}

/** Scans per play. A screen that never played reports nothing rather than 1. */
export function scanRatio(plays: number, scans: number): number {
  return plays > 0 ? scans / plays : 0;
}

/** Two spellings of one address must read as one place, or the signal misses. */
export function normaliseLocation(location: string): string {
  return location.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Counts each value, ignoring the rows that carry none. */
export function countBy(values: (string | null | undefined)[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

export function flagDevice(stat: DeviceStat, context: ReviewContext): DeviceFlags {
  const ratio = scanRatio(stat.plays, stat.scans);
  const network = stat.lastNetwork ? (context.networkCounts.get(stat.lastNetwork) ?? 0) : 0;
  const place = context.locationCounts.get(normaliseLocation(stat.location)) ?? 0;

  return {
    scanRatio: ratio,
    lowScanRatio:
      stat.plays >= economy.payout.scanRatioMinPlays && ratio < economy.payout.lowScanRatio,
    activeHours: stat.playsByHour.filter((plays) => plays > 0).length,
    outOfHoursPlays: outOfHoursPlays(stat.playsByHour, stat.openHour, stat.closeHour),
    daysSilent: stat.lastSeenAt
      ? Math.floor((context.now.getTime() - stat.lastSeenAt.getTime()) / 86_400_000)
      : null,
    sharedNetwork: network > 1,
    sharedLocation: place > 1,
  };
}
