import { economy } from "@repo/config/economy";
import { z } from "zod";

/**
 * The pure side of the payout currency. The ledger is in USD and the platform
 * settles MYR, so a payout is converted once, on the day the admin approves
 * (docs/adr/0012). Nothing here fetches; `bnm.ts` does that.
 */

/** One day's rate, and where it came from. */
export interface FxQuote {
  /** MYR per USD. */
  rate: number;
  /** The day the rate is for, `YYYY-MM-DD`. */
  date: string;
  source: "BNM";
}

/**
 * The shape of `GET /public/exchange-rate/USD?session=1200&quote=rm` on Bank
 * Negara's open API. Only the middle rate and its date are read.
 */
const bnmBody = z.object({
  data: z.object({
    currency_code: z.literal("USD"),
    unit: z.number().positive(),
    rate: z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      middle_rate: z.number().positive(),
    }),
  }),
});

/** Read the quote off Bank Negara's answer, or throw when the shape is not theirs. */
export function parseBnmQuote(body: unknown): FxQuote {
  const parsed = bnmBody.parse(body);
  return {
    rate: parsed.data.rate.middle_rate / parsed.data.unit,
    date: parsed.data.rate.date,
    source: "BNM",
  };
}

/** True when the rate is one the ringgit could really have. A feed that says 0 or 40 fails this. */
export function rateInBounds(rate: number): boolean {
  const { min, max } = economy.payout.paidIn.rateBounds;
  return Number.isFinite(rate) && rate >= min && rate <= max;
}

/** USD cents as cents of the payout currency, at the rate, to the nearest cent. */
export function convertCents(usdCents: number, rate: number): number {
  return Math.round(usdCents * rate);
}
