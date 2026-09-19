import { zValidator } from "@hono/zod-validator";
import {
  connectStripeInput,
  connectStripeOutput,
  payoutOverviewOutput,
  payoutRequestOutput,
  stripeAccountOutput,
} from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import {
  connectStripe,
  getPayoutOverview,
  refreshStripeAccount,
  requestPayout,
} from "./payouts.service";

/** The distributor's own side of a payout. The admin side lives under `/admin`. */
export const payoutsRouter = new Hono<{ Variables: AppVariables }>();

payoutsRouter.use("*", async (c, next) => {
  if (!c.get("user")) throw new HTTPException(401, { message: "Unauthorized" });
  await next();
});

payoutsRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const overview = await getPayoutOverview(user.id);
  return c.json(
    payoutOverviewOutput.parse(overview satisfies z.input<typeof payoutOverviewOutput>),
  );
});

/** Opens Stripe's onboarding. The first call also creates the connected account. */
payoutsRouter.post("/stripe/connect", zValidator("json", connectStripeInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const result = await connectStripe(user.id, user.email, c.req.valid("json"));
  return c.json(connectStripeOutput.parse(result satisfies z.input<typeof connectStripeOutput>));
});

/** Reads the flags back from Stripe, for the moment the member returns. */
payoutsRouter.post("/stripe/refresh", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await refreshStripeAccount(user.id);
  return c.json(stripeAccountOutput.parse(row satisfies z.input<typeof stripeAccountOutput>));
});

payoutsRouter.post("/", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await requestPayout(user.id);
  return c.json(payoutRequestOutput.parse(row satisfies z.input<typeof payoutRequestOutput>), 201);
});
