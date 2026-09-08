import { device } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

const deviceColumns = {
  id: true,
  name: true,
  deviceId: true,
  venueType: true,
  location: true,
  photoUrl: true,
  promotionName: true,
  promotionTagline: true,
  promotionUrl: true,
  promotionLogoUrl: true,
  tier: true,
  state: true,
  rejectionReason: true,
  dailyPlayCap: true,
  approvedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

/**
 * What an admin sees. It carries no `apiKey`: the key is the screen's credential
 * for the serve endpoint, and an admin reviewing a device is not its owner.
 */
export const deviceAdminContract = toWire(createSelectSchema(device).pick(deviceColumns));

/**
 * Owner routes only. `apiKey` is here so the distributor can pair their own
 * screen; nothing that leaves the owner's own session may use this shape.
 */
export const deviceContract = toWire(
  createSelectSchema(device).pick({ ...deviceColumns, apiKey: true }),
);

export type Device = z.output<typeof deviceContract>;
export type DeviceForAdmin = z.output<typeof deviceAdminContract>;
export type DeviceState = Device["state"];
export type DeviceTier = Device["tier"];
export type VenueType = Device["venueType"];
