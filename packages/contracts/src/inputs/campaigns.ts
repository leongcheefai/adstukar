import { economy } from "@repo/config/economy";
import * as z from "zod/v4";

export const httpUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((v) => /^https?:\/\//i.test(v), { message: "URL must start with http:// or https://" });

const dailyBudget = z.number().int().min(economy.caps.minDailyBudget);

/** What a campaign is called. A slot booking names one too, so the rule lives once. */
export const campaignName = z.string().trim().min(1).max(60);

export const createCampaignInput = z.object({
  name: campaignName,
  url: httpUrl,
  dailyBudget: dailyBudget.optional(),
});

// `state` takes only the two an advertiser owns. `draft` is where a campaign
// starts and `archived` is what the delete route writes, so neither is offered.
export const updateCampaignInput = z.object({
  name: campaignName.optional(),
  url: httpUrl.optional(),
  dailyBudget: dailyBudget.optional(),
  state: z.enum(["active", "paused"]).optional(),
});

export type CreateCampaignInput = z.infer<typeof createCampaignInput>;
export type UpdateCampaignInput = z.infer<typeof updateCampaignInput>;
