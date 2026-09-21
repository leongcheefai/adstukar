import { slot } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

/**
 * One booking, as the member sees it. The owner id stays off the wire: the
 * row only ever travels inside the owner's own list.
 */
export const slotContract = toWire(
  createSelectSchema(slot).pick({
    id: true,
    campaignId: true,
    position: true,
    state: true,
    amount: true,
    bookedAt: true,
    startsAt: true,
    endsAt: true,
    endedAt: true,
    createdAt: true,
  }),
);

export type Slot = z.output<typeof slotContract>;
export type SlotState = Slot["state"];
