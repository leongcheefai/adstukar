import { zValidator } from "@hono/zod-validator";
import {
  bookSlotInput,
  listSlotsOutput,
  slotLoopOutput,
  slotWithCampaignOutput,
} from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import { bookSlot, listOwnSlots, loop } from "./slots.service";

/**
 * The advertiser's side of a slot. The loop is public: every CapyTV screen
 * prints it, with or without a session, and it names no member. It is
 * registered before the guard, so the guard never sees it.
 */
export const slotsRouter = new Hono<{ Variables: AppVariables }>();

slotsRouter.get("/loop", async (c) => {
  const result = await loop();
  return c.json(slotLoopOutput.parse(result satisfies z.input<typeof slotLoopOutput>));
});

slotsRouter.use("*", async (c, next) => {
  if (!c.get("user")) throw new HTTPException(401, { message: "Unauthorized" });
  await next();
});

slotsRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const result = await listOwnSlots(user.id);
  return c.json(listSlotsOutput.parse(result satisfies z.input<typeof listSlotsOutput>));
});

slotsRouter.post("/", zValidator("json", bookSlotInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const result = await bookSlot(user.id, c.req.valid("json"));
  return c.json(
    slotWithCampaignOutput.parse(result satisfies z.input<typeof slotWithCampaignOutput>),
    201,
  );
});
