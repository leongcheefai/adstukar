import { DEVICE_STATES, DEVICE_TIERS } from "@repo/db/enums";
import * as z from "zod/v4";
import { campaignContract } from "../entities/campaign";
import { deviceAdminContract } from "../entities/device";
import { listingContract } from "../entities/listing";
import { payoutAccountContract } from "../entities/payout-account";
import { payoutRequestContract } from "../entities/payout-request";
import { topupContract } from "../entities/topup";
import { toWire } from "../lib/wire";
import { topupHistoryItemContract } from "./topups";

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

/**
 * One screen as the payout review reads it. Hand-authored: no table owns a count
 * of plays over a window, and the flags are worked out rather than stored.
 */
export const reviewedDeviceContract = toWire(
  z.object({
    deviceId: z.string(),
    name: z.string(),
    location: z.string(),
    tier: z.enum(DEVICE_TIERS),
    state: z.enum(DEVICE_STATES),
    plays: z.number().int(),
    scans: z.number().int(),
    /** Counted plays by hour of day, in the venue's own time. Always 24 entries. */
    playsByHour: z.array(z.number().int()),
    /** The hours the venue states it is open. Null when it states none. */
    openHour: z.number().int().nullable(),
    closeHour: z.number().int().nullable(),
    lastSeenAt: z.date().nullable(),
    /** A network prefix, never an address. */
    lastNetwork: z.string().nullable(),
    flags: z.object({
      scanRatio: z.number(),
      lowScanRatio: z.boolean(),
      activeHours: z.number().int(),
      outOfHoursPlays: z.number().int(),
      daysSilent: z.number().int().nullable(),
      sharedNetwork: z.boolean(),
      sharedLocation: z.boolean(),
    }),
  }),
);

/**
 * One payout waiting for a decision, with the history behind it. The account is
 * here because an admin sends the money by hand and needs the destination in
 * front of them (docs/adr/0005).
 */
export const payoutReviewContract = z.object({
  request: payoutRequestContract,
  owner,
  account: payoutAccountContract.nullable(),
  devices: z.array(reviewedDeviceContract),
});

export const payoutQueueOutput = z.object({
  /** Days of history the counts cover. */
  windowDays: z.number().int(),
  items: z.array(payoutReviewContract),
});

export const reviewPayoutOutput = payoutRequestContract;

export type ReviewedDevice = z.output<typeof reviewedDeviceContract>;
export type PayoutReview = z.output<typeof payoutReviewContract>;
export type PayoutQueue = z.output<typeof payoutQueueOutput>;

/**
 * One top-up as the refund desk reads it. A member never refunds their own
 * purchase: they ask, and an admin gives the unspent part back from here. The
 * money and the block are worked out the same way the member's own table did.
 */
export const topupReviewContract = topupHistoryItemContract.extend({ owner });

export const topupQueueOutput = z.object({
  refundWindowDays: z.number().int(),
  items: z.array(topupReviewContract),
});

export const refundTopupOutput = topupContract;

export type TopupReview = z.output<typeof topupReviewContract>;
export type TopupQueue = z.output<typeof topupQueueOutput>;
