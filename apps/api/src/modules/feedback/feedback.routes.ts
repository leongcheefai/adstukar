import { zValidator } from "@hono/zod-validator";
import { createFeedbackInput, createFeedbackOutput } from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import { createFeedback } from "./feedback.service";

export const feedbackRouter = new Hono<{ Variables: AppVariables }>();

feedbackRouter.post("/", zValidator("json", createFeedbackInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const input = c.req.valid("json");
  const result = await createFeedback(user.id, user.email, input);
  return c.json(createFeedbackOutput.parse(result satisfies z.input<typeof createFeedbackOutput>));
});
