import * as z from "zod/v4";
import { campaignContract } from "../entities/campaign";
import { listingContract } from "../entities/listing";

// A campaign always travels with its listings and with what it has spent today:
// the dashboard draws one section per campaign, and a daily budget with no spend
// beside it says nothing about how the campaign is pacing.
export const campaignWithListingsOutput = z.object({
  campaign: campaignContract,
  listings: z.array(listingContract),
  /** Points this campaign has spent since the start of the UTC day. */
  spentToday: z.number().int(),
});

export const listCampaignsOutput = z.array(campaignWithListingsOutput);
export const campaignOutput = campaignWithListingsOutput;
export const archiveCampaignOutput = z.object({ id: z.string() });

export const verifyCampaignOutput = z.object({
  verified: z.boolean(),
  method: z.enum(["well-known", "dns"]).nullable(),
  message: z.string(),
});

export type CampaignWithListings = z.output<typeof campaignWithListingsOutput>;
export type VerifyCampaignResponse = z.output<typeof verifyCampaignOutput>;
export type VerificationMethod = NonNullable<VerifyCampaignResponse["method"]>;
