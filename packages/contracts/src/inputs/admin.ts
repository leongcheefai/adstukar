import * as z from "zod/v4";

export const rejectProductInput = z.object({
  reason: z.string().trim().min(1).max(500),
});

export type RejectProductInput = z.infer<typeof rejectProductInput>;
