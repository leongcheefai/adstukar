import { zValidator } from "@hono/zod-validator";
import { moderateProductOutput, moderationQueueOutput, rejectProductInput } from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import { approveProduct, listModerationQueue, rejectProduct } from "./admin.service";

export const adminRouter = new Hono<{ Variables: AppVariables }>();

adminRouter.use("*", async (c, next) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  if (user.role !== "admin") throw new HTTPException(403, { message: "Forbidden" });
  await next();
});

adminRouter.get("/moderation", async (c) => {
  const rows = await listModerationQueue();
  return c.json(moderationQueueOutput.parse(rows satisfies z.input<typeof moderationQueueOutput>));
});

adminRouter.post("/products/:id/approve", async (c) => {
  const row = await approveProduct(c.req.param("id"));
  return c.json(moderateProductOutput.parse(row satisfies z.input<typeof moderateProductOutput>));
});

adminRouter.post("/products/:id/reject", zValidator("json", rejectProductInput), async (c) => {
  const row = await rejectProduct(c.req.param("id"), c.req.valid("json").reason);
  return c.json(moderateProductOutput.parse(row satisfies z.input<typeof moderateProductOutput>));
});
