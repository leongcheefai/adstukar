import * as z from "zod/v4";

export const createFeedbackOutput = z.object({
  id: z.string(),
  issueUrl: z.string().optional(),
});

export type CreateFeedbackResponse = z.output<typeof createFeedbackOutput>;
