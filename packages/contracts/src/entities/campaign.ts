import { campaign } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

// Owner and admin routes only. `verificationToken` is shown to the owner so they can
// publish it; public serving never returns this shape (see modules/serve.ts).
export const campaignContract = toWire(
  createSelectSchema(campaign).pick({
    id: true,
    name: true,
    url: true,
    domain: true,
    state: true,
    pauseReason: true,
    pausedAt: true,
    dailyBudget: true,
    verificationToken: true,
    verifiedAt: true,
    createdAt: true,
    updatedAt: true,
  }),
);

export type Campaign = z.output<typeof campaignContract>;
export type CampaignState = Campaign["state"];
