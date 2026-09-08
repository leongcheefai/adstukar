import { zValidator } from "@hono/zod-validator";
import {
  approveDeviceInput,
  moderateDeviceOutput,
  moderateListingOutput,
  moderationQueueOutput,
  payPayoutInput,
  payoutQueueOutput,
  rejectInput,
  reviewPayoutOutput,
} from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import { listPayoutQueue, payPayout, rejectPayout } from "../payouts/payouts.service";
import {
  approveDevice,
  approveListing,
  listModerationQueue,
  rejectDevice,
  rejectListing,
} from "./admin.service";

export const adminRouter = new Hono<{ Variables: AppVariables }>();

adminRouter.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  if (user.role !== "admin") throw new HTTPException(403, { message: "Forbidden" });
  await next();
});

adminRouter.get("/moderation", async (c) => {
  const queue = await listModerationQueue();
  return c.json(moderationQueueOutput.parse(queue satisfies z.input<typeof moderationQueueOutput>));
});

adminRouter.post("/listings/:id/approve", async (c) => {
  const row = await approveListing(c.req.param("id"));
  return c.json(moderateListingOutput.parse(row satisfies z.input<typeof moderateListingOutput>));
});

adminRouter.post("/listings/:id/reject", zValidator("json", rejectInput), async (c) => {
  const row = await rejectListing(c.req.param("id"), c.req.valid("json").reason);
  return c.json(moderateListingOutput.parse(row satisfies z.input<typeof moderateListingOutput>));
});

adminRouter.post("/devices/:id/approve", zValidator("json", approveDeviceInput), async (c) => {
  const row = await approveDevice(c.req.param("id"), c.req.valid("json").tier);
  return c.json(moderateDeviceOutput.parse(row satisfies z.input<typeof moderateDeviceOutput>));
});

adminRouter.post("/devices/:id/reject", zValidator("json", rejectInput), async (c) => {
  const row = await rejectDevice(c.req.param("id"), c.req.valid("json").reason);
  return c.json(moderateDeviceOutput.parse(row satisfies z.input<typeof moderateDeviceOutput>));
});

/**
 * The payout batch. An admin reads the history behind each request — the
 * scan-to-play ratio, the hours each screen played in, and whether devices share
 * an address or a network — and then pays or refuses.
 */
adminRouter.get("/payouts", async (c) => {
  const queue = await listPayoutQueue();
  return c.json(payoutQueueOutput.parse(queue satisfies z.input<typeof payoutQueueOutput>));
});

adminRouter.post("/payouts/:id/pay", zValidator("json", payPayoutInput), async (c) => {
  const admin = c.get("user");
  if (!admin) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await payPayout(c.req.param("id"), admin.id, c.req.valid("json").reference);
  return c.json(reviewPayoutOutput.parse(row satisfies z.input<typeof reviewPayoutOutput>));
});

adminRouter.post("/payouts/:id/reject", zValidator("json", rejectInput), async (c) => {
  const admin = c.get("user");
  if (!admin) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await rejectPayout(c.req.param("id"), admin.id, c.req.valid("json").reason);
  return c.json(reviewPayoutOutput.parse(row satisfies z.input<typeof reviewPayoutOutput>));
});
