import * as z from "zod/v4";

export const rejectInput = z.object({
  reason: z.string().trim().min(1).max(500),
});

export type RejectInput = z.infer<typeof rejectInput>;
