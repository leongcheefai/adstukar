import { economy } from "./economy";

/**
 * The one place that turns the ledger unit into a dollar string, and back.
 * Every app imports it, so no page carries its own arithmetic and every page
 * prints the same figure for the same amount.
 *
 * The locale is fixed: the figure a member reads is part of the product, and
 * a test must be able to name it.
 */
const LOCALE = "en-US";

const wholeCents = new Intl.NumberFormat(LOCALE, { style: "currency", currency: "USD" });

const finerThanCents = new Intl.NumberFormat(LOCALE, {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 3,
  maximumFractionDigits: 3,
});

/** Units in one cent. */
const PER_CENT = economy.unit.perUsd / 100;

/**
 * A ledger amount as dollars. Two decimals when the amount is whole cents, three
 * otherwise. It never rounds: one play is `-$0.004`, and a row that read
 * `-$0.00` would be a lie.
 */
export function usd(amount: number): string {
  const format = amount % PER_CENT === 0 ? wholeCents : finerThanCents;
  return format.format(amount / economy.unit.perUsd);
}

/** What Stripe moved, in cents, as dollars. */
export function usdCents(cents: number): string {
  return wholeCents.format(cents / 100);
}

/** A play rate as the dollars 1,000 plays cost. The figure alone, for a table cell. */
export function usdPerThousand(rate: number): string {
  return usd(rate * 1000);
}

/** A play rate in a sentence. */
export function perThousandPlays(rate: number): string {
  return `${usdPerThousand(rate)} per 1,000 plays`;
}

/** A scan rate in a sentence. A scan is always whole cents. */
export function perScan(rate: number): string {
  return `${usd(rate)} per scan`;
}

/**
 * What a member typed, as an amount. It takes an optional dollar sign, thousands
 * commas, and up to two decimals. Anything else, and a negative figure, is null.
 * The result is always whole cents, so it fits a Stripe charge as well as the
 * ledger.
 */
export function parseUsd(text: string): number | null {
  const cleaned = text.trim().replace(/^\$/, "").replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return null;
  const [whole, fraction = ""] = cleaned.split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return (cents * economy.unit.perUsd) / 100;
}
