import { zValidator } from "@hono/zod-validator";
import { createTopupInput, topupCheckoutOutput, topupOverviewOutput } from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import { createTopupCheckout, getTopupOverview } from "./topups.service";

/**
 * The advertiser's own side of a top-up. The money arrives through the Stripe
 * webhook in `../billing`, so no route here ever puts money in. A refund is an
 * admin's act and lives under `../admin`: a member asks, and never presses it.
 */
export const topupsRouter = new Hono<{ Variables: AppVariables }>();

topupsRouter.use("*", async (c, next) => {
  if (!c.get("user")) throw new HTTPException(401, { message: "Unauthorized" });
  await next();
});

topupsRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const overview = await getTopupOverview(user.id);
  return c.json(topupOverviewOutput.parse(overview satisfies z.input<typeof topupOverviewOutput>));
});

topupsRouter.post("/checkout", zValidator("json", createTopupInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const result = await createTopupCheckout(user.id, c.req.valid("json"));
  return c.json(topupCheckoutOutput.parse(result satisfies z.input<typeof topupCheckoutOutput>));
});
