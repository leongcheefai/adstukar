import { getConnInfo } from "@hono/node-server/conninfo";
import { zValidator } from "@hono/zod-validator";
import { economy } from "@repo/config/economy";
import { reportInput, reportOutput, serveOutput, serveQuery } from "@repo/contracts";
import { type Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import { createRateLimiter } from "../../lib/rate-limit";
import { recordReport, recordScan, serveListing } from "./serve.service";

/**
 * Public endpoints called from CapyTV on a member's screen, and from the phone of
 * a viewer who scans. No session, any origin, rate-limited per device key and per
 * IP. Mounted at the root so paths are `/serve`, `/report`, `/scan/:id`.
 */
export const serveRouter = new Hono<{ Variables: AppVariables }>();

const serveByKey = createRateLimiter({
  limit: economy.rateLimit.servePerKey,
  windowMs: economy.rateLimit.windowMs,
});
const serveByIp = createRateLimiter({
  limit: economy.rateLimit.servePerIp,
  windowMs: economy.rateLimit.windowMs,
});
const reportByIp = createRateLimiter({
  limit: economy.rateLimit.reportPerIp,
  windowMs: economy.rateLimit.windowMs,
});
// A scan pays a bonus, so the redirect is a money endpoint and is limited like
// the other two. The phone that scans is not the screen, so it gets its own bucket.
const scanByIp = createRateLimiter({
  limit: economy.rateLimit.scanPerIp,
  windowMs: economy.rateLimit.windowMs,
});

export function clientIp(c: Context): string {
  const forwarded = c.req.header("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() ?? "unknown";
  try {
    return getConnInfo(c).remote.address ?? "unknown";
  } catch {
    return "unknown";
  }
}

const NO_STORE = { "cache-control": "no-store" };

serveRouter.get("/serve", zValidator("query", serveQuery), async (c) => {
  const { key } = c.req.valid("query");
  const ip = clientIp(c);
  if (!serveByKey.hit(key) || !serveByIp.hit(ip)) {
    throw new HTTPException(429, { message: "Too many requests" });
  }
  const result = await serveListing({ key });
  return c.json(serveOutput.parse(result satisfies z.input<typeof serveOutput>), 200, NO_STORE);
});

// A kiosk browser losing its page sends this through `navigator.sendBeacon`, which
// can only send CORS-safelisted content types. The body therefore arrives as
// text/plain; parse it by hand instead of through the JSON validator.
serveRouter.post("/report", async (c) => {
  const ip = clientIp(c);
  if (!reportByIp.hit(ip)) throw new HTTPException(429, { message: "Too many requests" });
  let parsed: z.infer<typeof reportInput>;
  try {
    parsed = reportInput.parse(JSON.parse(await c.req.text()));
  } catch {
    throw new HTTPException(400, { message: "Invalid report" });
  }
  const result = await recordReport(parsed.playId, parsed.key);
  return c.json(reportOutput.parse(result satisfies z.input<typeof reportOutput>), 200, NO_STORE);
});

serveRouter.get("/scan/:id", async (c) => {
  if (!scanByIp.hit(clientIp(c))) throw new HTTPException(429, { message: "Too many requests" });
  const url = await recordScan(c.req.param("id"));
  if (!url) throw new HTTPException(404, { message: "Unknown play" });
  return c.redirect(url, 302);
});
