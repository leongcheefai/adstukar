import { zValidator } from "@hono/zod-validator";
import {
  payoutOverviewOutput,
  payoutRequestOutput,
  savePayoutAccountInput,
  savePayoutAccountOutput,
} from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import { getPayoutOverview, requestPayout, savePayoutAccount } from "./payouts.service";

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

payoutsRouter.put("/account", zValidator("json", savePayoutAccountInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await savePayoutAccount(user.id, c.req.valid("json"));
  return c.json(
    savePayoutAccountOutput.parse(row satisfies z.input<typeof savePayoutAccountOutput>),
  );
});

payoutsRouter.post("/", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await requestPayout(user.id);
  return c.json(payoutRequestOutput.parse(row satisfies z.input<typeof payoutRequestOutput>), 201);
});
