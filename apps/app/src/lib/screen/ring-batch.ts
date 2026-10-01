import type { RingBand, RingLap } from "@repo/contracts/types";

/**
 * The ring batch a registered set holds (docs/adr/0016). Each lap is the whole
 * ring once; each paid brand band carries the play its next crossing reports.
 * Pure, so the rules run without a browser.
 */

type PaidBand = Extract<RingBand, { kind: "brand" }> & { playId: string; expiresAt: string };

function reportable(band: RingBand, now: Date): band is PaidBand {
  return (
    band.kind === "brand" &&
    band.playId !== null &&
    band.expiresAt !== null &&
    new Date(band.expiresAt) > now
  );
}

/**
 * Takes the play a crossing at `position` reports: the one in the first lap that
 * still holds a reportable play there. The play leaves the batch, so the next
 * crossing takes the next lap's.
 */
export function takePlay(
  laps: RingLap[],
  position: number,
  now: Date,
): { play: { playId: string; expiresAt: string } | null; laps: RingLap[] } {
  for (const [index, lap] of laps.entries()) {
    const band = lap.bands.find((b) => b.position === position);
    if (!band || !reportable(band, now)) continue;
    const spent: RingLap = {
      bands: lap.bands.map((b) =>
        b.position === position && b.kind === "brand" ? { ...b, playId: null, expiresAt: null } : b,
      ),
    };
    return {
      play: { playId: band.playId, expiresAt: band.expiresAt },
      laps: laps.map((l, i) => (i === index ? spent : l)),
    };
  }
  return { play: null, laps };
}

function holdsPlay(lap: RingLap, now: Date): boolean {
  return lap.bands.some((band) => reportable(band, now));
}

function unpaid(lap: RingLap): RingLap {
  return {
    bands: lap.bands.map((band) =>
      band.kind === "brand" ? { ...band, playId: null, expiresAt: null } : band,
    ),
  };
}

/** Laps that still hold a reportable play. The set refills when this runs low. */
export function lapsLeft(laps: RingLap[], now: Date): number {
  return laps.filter((lap) => holdsPlay(lap, now)).length;
}

/**
 * The batch after a refill: the laps still worth reporting, then the new ones.
 * When nothing is left at all, the last lap stays, unpaid, so the crawl keeps its
 * bands while the network is down.
 */
export function merge(held: RingLap[], fresh: RingLap[], now: Date): RingLap[] {
  const next = [...held.filter((lap) => holdsPlay(lap, now)), ...fresh];
  if (next.length > 0) return next;
  const last = held.at(-1);
  return last ? [unpaid(last)] : [];
}
