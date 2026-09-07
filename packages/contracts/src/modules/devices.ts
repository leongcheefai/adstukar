import * as z from "zod/v4";
import { deviceContract } from "../entities/device";

// A device always travels with its excluded terms; the dashboard edits both together.
export const deviceWithTermsOutput = z.object({
  device: deviceContract,
  excludedTerms: z.array(z.string()),
});

export const listDevicesOutput = z.array(deviceWithTermsOutput);
export const archiveDeviceOutput = z.object({ id: z.string() });

export type DeviceWithTerms = z.output<typeof deviceWithTermsOutput>;
