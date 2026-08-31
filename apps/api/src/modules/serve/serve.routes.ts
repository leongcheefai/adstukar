import { getConnInfo } from "@hono/node-server/conninfo";
import { zValidator } from "@hono/zod-validator";
import { economy } from "@repo/config/economy";
import { beaconInput, beaconOutput, serveOutput, serveQuery } from "@repo/contracts";
import { type Context, Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import { createRateLimiter } from "../../lib/rate-limit";
import { recordBeacon, recordClick, serveAd } from "./serve.service";

/**
 * Public endpoints called from member sites. No session, any origin, rate-limited
 * per API key and per IP. Mounted at the root so paths are `/serve`, `/beacon`, `/click/:id`.
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
const beaconByIp = createRateLimiter({
  limit: economy.rateLimit.beaconPerIp,
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
  const result = await serveAd({ key, ip, userAgent: c.req.header("user-agent") ?? "" });
  return c.json(serveOutput.parse(result satisfies z.input<typeof serveOutput>), 200, NO_STORE);
});

// `navigator.sendBeacon` can only send CORS-safelisted content types, so the body
// arrives as text/plain; parse it by hand instead of through the JSON validator.
serveRouter.post("/beacon", async (c) => {
  const ip = clientIp(c);
  if (!beaconByIp.hit(ip)) throw new HTTPException(429, { message: "Too many requests" });
  let parsed: z.infer<typeof beaconInput>;
  try {
    parsed = beaconInput.parse(JSON.parse(await c.req.text()));
  } catch {
    throw new HTTPException(400, { message: "Invalid beacon" });
  }
  const result = await recordBeacon(parsed.impressionId, parsed.key);
  return c.json(beaconOutput.parse(result satisfies z.input<typeof beaconOutput>), 200, NO_STORE);
});

serveRouter.get("/click/:id", async (c) => {
  const url = await recordClick(c.req.param("id"));
  if (!url) throw new HTTPException(404, { message: "Unknown impression" });
  return c.redirect(url, 302);
});
