import { economy } from "@repo/config/economy";

/**
 * Money crosses the boundary in US cents, because a float would lose a cent
 * somewhere between the ledger and the screen. This is the one place that turns
 * those cents into the string a member reads.
 */
export function usd(cents: number): string {
  return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}

/** A point is a part of a cent at the peg, so a small sum needs more digits. */
const POINT_DIGITS = Math.max(2, Math.ceil(Math.log10(economy.pointsPerUsd)));

/**
 * Points as the dollars they are worth at the peg. The ledger still counts in
 * points; this is only how a member reads them. The division is exact at the
 * peg, so nothing is rounded: one play at 3 points reads $0.003.
 */
export function pointsUsd(points: number): string {
  return (points / economy.pointsPerUsd).toLocaleString(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: POINT_DIGITS,
  });
}
