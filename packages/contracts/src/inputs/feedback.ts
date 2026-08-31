import { FEEDBACK_TYPES } from "@repo/db/enums";
import * as z from "zod/v4";

export const createFeedbackInput = z.object({
  type: z.enum(FEEDBACK_TYPES),
  message: z.string().min(1).max(2000),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackInput>;
export type FeedbackType = CreateFeedbackInput["type"];
