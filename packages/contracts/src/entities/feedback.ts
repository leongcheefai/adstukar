import { feedback } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

/**
 * One piece of feedback as the admin reads it. The member id stays off the
 * wire: the queue carries the member's name and email beside the row, and the
 * page has nothing to address by id.
 */
export const feedbackContract = toWire(
  createSelectSchema(feedback).pick({
    id: true,
    type: true,
    message: true,
    createdAt: true,
  }),
);

export type Feedback = z.output<typeof feedbackContract>;
