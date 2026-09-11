import { economy } from "@repo/config/economy";
import * as z from "zod/v4";

export const serveQuery = z.object({
  key: z.string().min(1).max(128),
});

/** How many plays one cached batch holds. A device may ask for fewer. */
export const loopQuery = z.object({
  key: z.string().min(1).max(128),
  size: z.coerce.number().int().min(1).max(economy.loop.size).default(economy.loop.size),
});

/** CapyTV reports a play once the listing has held the placement for its dwell. */
export const reportInput = z.object({
  playId: z.string().min(1).max(64),
  key: z.string().min(1).max(128),
  /**
   * When the play actually ran. A queued report sends it so a day of offline
   * plays lands on the day it played. The server clamps it to the life of the
   * play, so a device cannot move its own history.
   */
  playedAt: z.iso.datetime().optional(),
});

export type LoopQuery = z.infer<typeof loopQuery>;
export type ReportInput = z.infer<typeof reportInput>;
