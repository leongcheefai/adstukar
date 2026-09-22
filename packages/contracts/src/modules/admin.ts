import { DEVICE_STATES, DEVICE_TIERS } from "@repo/db/enums";
import * as z from "zod/v4";
import { campaignContract } from "../entities/campaign";
import { deviceAdminContract } from "../entities/device";
import { feedbackContract } from "../entities/feedback";
import { listingContract } from "../entities/listing";
import { payoutRequestContract } from "../entities/payout-request";
import { stripeAccountContract } from "../entities/stripe-account";
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
 * One payout waiting for a decision, with the history behind it. The Stripe
 * account is here because the admin's approval sends the money there, and the
 * queue must say whether it may (docs/adr/0008).
 */
export const payoutReviewContract = z.object({
  request: payoutRequestContract,
  owner,
  stripeAccount: stripeAccountContract.nullable(),
  devices: z.array(reviewedDeviceContract),
});

export const payoutQueueOutput = z.object({
  /** Days of history the counts cover. */
  windowDays: z.number().int(),
  items: z.array(payoutReviewContract),
});

export const reviewPayoutOutput = payoutRequestContract;

/**
 * What a request would pay today, in the payout currency, at the day's rate.
 * Hand-authored: it is a preview from the feed, and no table owns it. The
 * transfer takes its own rate a moment later (docs/adr/0012).
 */
export const payoutQuoteOutput = z.object({
  usdCents: z.number().int(),
  paidCents: z.number().int(),
  /** ISO 4217, upper case. */
  currency: z.string(),
  /** Units of `currency` per USD. */
  rate: z.number().positive(),
  /** The day the rate is for, `YYYY-MM-DD`. */
  date: z.string(),
  source: z.string(),
});

export type ReviewedDevice = z.output<typeof reviewedDeviceContract>;
export type PayoutReview = z.output<typeof payoutReviewContract>;
export type PayoutQueue = z.output<typeof payoutQueueOutput>;
export type PayoutQuote = z.output<typeof payoutQuoteOutput>;

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

/**
 * The feedback desk. A member sends feedback from the account menu, and an
 * admin reads it here, open rows first. The one act is to mark a row resolved,
 * and to reopen it: the GitHub handoff (when it is on) already happened at
 * send time.
 */
export const feedbackReviewContract = z.object({
  feedback: feedbackContract,
  owner,
});

export const feedbackQueueOutput = z.object({
  items: z.array(feedbackReviewContract),
});

export const resolveFeedbackOutput = feedbackContract;

export type FeedbackReview = z.output<typeof feedbackReviewContract>;
export type FeedbackQueue = z.output<typeof feedbackQueueOutput>;

/**
 * What the week's slot revenue is against what the week's plays posted. It is
 * the one number that says when to move a lever: the slot price, the pace of
 * approval, or the pace of tier promotion (docs/adr/0010). Hand-authored: no
 * table owns a sum over a week.
 */
export const poolOutput = toWire(
  z.object({
    /** The Monday the week starts on, UTC. */
    weekStart: z.date(),
    /** `slot.amount` summed over bookings made this week that were not refunded. */
    slotRevenue: z.number().int(),
    /** `earn` rows summed over this week, less the ones the void job closed. */
    earnPosted: z.number().int(),
  }),
);

export type Pool = z.output<typeof poolOutput>;
