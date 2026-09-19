import { DAY_MS, amountToCents, centsToAmount, economy } from "@repo/config/economy";
import type { TopupRefundBlock, TopupState } from "@repo/db/enums";

/**
 * The rules that decide what a top-up sells and what it may give back. They are
 * pure, so the money and the refusals can be read without a database.
 *
 * Bought money never expires, and a refund is the only way it leaves. It
 * returns the unspent part at the peg, less what the card processor kept, and
 * only inside the window. See docs/adr/0001.
 */

/**
 * One pack, as the config declares it. The shape is derived rather than written
 * out again, so a new field on a pack reaches every reader at once.
 */
export type TopupPack = (typeof economy.topup.packs)[number];

/** The pack an advertiser asked for, or null when the amount is not one we sell. */
export function findPack(amount: number): TopupPack | null {
  return economy.topup.packs.find((pack) => pack.amount === amount) ?? null;
}

/** The last moment a top-up may go back as money. The window runs from the payment. */
export function refundDeadline(paidAt: Date): Date {
  return new Date(paidAt.getTime() + economy.topup.refundWindowDays * DAY_MS);
}

/** One past purchase, as the allocation reads it. */
export interface TopupOutstanding {
  amount: number;
  /** What this top-up already gave back as money. */
  refunded: number;
}

/**
 * The unspent part of each top-up, in the order they were bought.
 *
 * Money inside the bought lot is fungible, so no row records which purchase a
 * spend took. Two rules recover it: a spend takes the oldest money first, and a
 * refund takes the amount of the one top-up it names. So the spend is whatever
 * the balance no longer holds beyond the refunds, and it comes off the oldest
 * purchases first.
 *
 * The balance decides how much is gone, never the sum of the rows. A void or any
 * other movement on the lot therefore lands here too, on the oldest purchases.
 *
 * @param topups Every paid or refunded top-up, oldest first.
 * @param boughtBalance Settled amount on the `bought` lot.
 */
export function unspentByTopup(topups: TopupOutstanding[], boughtBalance: number): number[] {
  const outstanding = topups.map((t) => Math.max(0, t.amount - t.refunded));
  const total = outstanding.reduce((sum, amount) => sum + amount, 0);
  let spent = Math.max(0, total - Math.max(0, boughtBalance));
  return outstanding.map((amount) => {
    const take = Math.min(amount, spent);
    spent -= take;
    return amount - take;
  });
}

export interface RefundAmount {
  /** The amount the refund takes back. Always a whole number of cents at the peg. */
  amount: number;
  /** What that amount is worth before the processor fee. */
  grossCents: number;
  feeCents: number;
  /** What the member gets back. */
  netCents: number;
}

/**
 * What a refund of the unspent part of one top-up takes and pays.
 *
 * A balance rarely lands on a whole cent, so the refund takes only the amount
 * the money covers and the remainder stays in the account — the same rule a
 * payout follows.
 *
 * The processor keeps its cut of the original sale and does not give it back,
 * so the member gets the rest. A part refund carries its share of the fixed
 * fee, and both halves round up: CapyAds must never pay out more than it took.
 */
export function refundAmount(
  refundable: number,
  pack: { amount: number; usdCents: number },
): RefundAmount {
  const grossCents = amountToCents(Math.max(0, refundable));
  const amount = centsToAmount(grossCents);
  const share = pack.amount > 0 ? amount / pack.amount : 0;
  const percentCents = Math.ceil((grossCents * economy.topup.processorFeeBps) / 10_000);
  const fixedCents = Math.ceil(economy.topup.processorFeeFixedCents * share);
  const feeCents = Math.min(grossCents, percentCents + fixedCents);
  return { amount, grossCents, feeCents, netCents: grossCents - feeCents };
}

/**
 * The one reason a refund is refused, or null when it may go ahead. The state
 * comes first: a top-up that never took money, or already gave it back, says
 * nothing about the window or the balance.
 */
export function refundBlock(input: {
  state: TopupState;
  paidAt: Date | null;
  refundable: number;
  netCents: number;
  now: Date;
}): TopupRefundBlock | null {
  if (input.state !== "paid" || !input.paidAt) return "not-paid";
  if (input.now.getTime() > refundDeadline(input.paidAt).getTime()) return "window-closed";
  if (input.refundable <= 0) return "nothing-left";
  if (input.netCents <= 0) return "below-fee";
  return null;
}
