/**
 * How much an expiring entry may actually take back.
 *
 * A credit is clamped to what its lot still holds: the member may have spent the
 * points already, and reversing the entry in full would charge for them twice and
 * leave the lot negative. A debit — the fee that pairs with an earn — expires in
 * full, because giving it back grows the lot rather than shrinking it.
 *
 * Pure, so the rule that decides how much money moves is testable without a
 * database.
 */
export function clampExpiry(delta: number, lotBalance: number): number {
  if (delta <= 0) return delta;
  return Math.min(delta, Math.max(0, lotBalance));
}
