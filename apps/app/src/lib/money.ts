/**
 * Money crosses the boundary in US cents, because a float would lose a cent
 * somewhere between the ledger and the screen. This is the one place that turns
 * those cents into the string a member reads.
 */
export function usd(cents: number): string {
  return (cents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" });
}
