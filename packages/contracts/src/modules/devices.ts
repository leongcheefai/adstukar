import * as z from "zod/v4";
import { deviceContract } from "../entities/device";

// A device always travels with the filters the distributor set on it; the
// dashboard edits the screen and its filters together.
export const deviceWithTermsOutput = z.object({
  device: deviceContract,
  excludedTerms: z.array(z.string()),
  /** Listings this device refuses by name. See `eligibleListingOutput`. */
  vetoedListingIds: z.array(z.string()),
});

export const listDevicesOutput = z.array(deviceWithTermsOutput);
export const archiveDeviceOutput = z.object({ id: z.string() });

/**
 * One approved listing as a distributor sees it before deciding. It carries the
 * creative and the campaign's name, and nothing that identifies the advertiser's
 * account: a veto is a judgement about what goes on the screen, not about who
 * bought it.
 */
export const eligibleListingContract = z.object({
  listingId: z.string(),
  /** The campaign's name. A listing carries no name of its own. */
  name: z.string(),
  tagline: z.string(),
  logoUrl: z.string().nullable(),
  vetoed: z.boolean(),
});

export const listEligibleListingsOutput = z.array(eligibleListingContract);

export type DeviceWithTerms = z.output<typeof deviceWithTermsOutput>;
export type EligibleListing = z.output<typeof eligibleListingContract>;
