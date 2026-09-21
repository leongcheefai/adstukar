import * as z from "zod/v4";
import { campaignContract } from "../entities/campaign";
import { listingContract } from "../entities/listing";

// A campaign always travels with its listings: the dashboard draws one section
// per campaign, and a listing is what a slot shows.
export const campaignWithListingsOutput = z.object({
  campaign: campaignContract,
  listings: z.array(listingContract),
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
