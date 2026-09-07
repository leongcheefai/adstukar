import * as z from "zod/v4";

export const serveQuery = z.object({
  key: z.string().min(1).max(128),
});

/** CapyTV reports a play once the listing has held the placement for its dwell. */
export const reportInput = z.object({
  playId: z.string().min(1).max(64),
  key: z.string().min(1).max(128),
});

export type ReportInput = z.infer<typeof reportInput>;
