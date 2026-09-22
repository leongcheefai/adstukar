import { HTTPException } from "hono/http-exception";
import { type FxQuote, parseBnmQuote } from "./fx";

/**
 * Bank Negara Malaysia's open API: the 12:00 session, quoted in ringgit. It
 * is official, free, and needs no key. One fetch per approval, no cache: a
 * stale rate is a wrong price, and the admin can always try again later.
 */
const BNM_URL = "https://api.bnm.gov.my/public/exchange-rate/USD?session=1200&quote=rm";
const FETCH_TIMEOUT_MS = 10_000;

/**
 * Today's USD→MYR rate, or a 503 the admin can read. A failure never falls
 * back to a guess: an approval waits until the feed answers.
 */
export async function fetchUsdMyr(fetchImpl: typeof fetch = fetch): Promise<FxQuote> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetchImpl(BNM_URL, {
      signal: controller.signal,
      headers: { accept: "application/vnd.BNM.API.v1+json" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return parseBnmQuote(await res.json());
  } catch (cause) {
    const reason = cause instanceof Error ? cause.message : String(cause);
    throw new HTTPException(503, {
      message: `Bank Negara did not give today's USD rate (${reason}). Try again in a minute.`,
    });
  } finally {
    clearTimeout(timer);
  }
}
