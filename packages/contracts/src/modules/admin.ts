import * as z from "zod/v4";
import { campaignContract } from "../entities/campaign";
import { deviceAdminContract } from "../entities/device";
import { listingContract } from "../entities/listing";

const owner = z.object({
  name: z.string(),
  email: z.string(),
});

/** A listing waiting for review, with the campaign that gives it its name. */
export const listingReviewContract = z.object({
  listing: listingContract,
  campaign: campaignContract,
  owner,
});

/** A device waiting for review. Approving it also stamps the tier. */
export const deviceReviewContract = z.object({
  device: deviceAdminContract,
  owner,
});

export const moderationQueueOutput = z.object({
  listings: z.array(listingReviewContract),
  devices: z.array(deviceReviewContract),
});

export const moderateListingOutput = listingContract;
export const moderateDeviceOutput = deviceAdminContract;

export type ListingReview = z.output<typeof listingReviewContract>;
export type DeviceReview = z.output<typeof deviceReviewContract>;
export type ModerationQueue = z.output<typeof moderationQueueOutput>;
