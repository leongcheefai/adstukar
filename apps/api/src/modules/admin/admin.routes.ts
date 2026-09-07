import { zValidator } from "@hono/zod-validator";
import {
  approveDeviceInput,
  moderateDeviceOutput,
  moderateListingOutput,
  moderationQueueOutput,
  rejectInput,
} from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
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
