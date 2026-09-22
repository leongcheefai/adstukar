import { economy } from "@repo/config/economy";
import { describe, expect, it } from "vitest";
import { type PayableInput, playPays } from "./payable";

const HOUR_MS = 3_600_000;
const dayStart = new Date("2026-09-22T00:00:00Z");
const hours = (n: number) => new Date(dayStart.getTime() + n * HOUR_MS);

const paid: PayableInput = {
  house: false,
  paidToday: 0,
  dailyPlayCap: 500,
  countedAt: hours(8),
  firstPlayAt: null,
  slotState: "running",
  listingState: "approved",
  campaignState: "active",
  verifiedAt: new Date("2026-09-01T00:00:00Z"),
};

describe("playPays", () => {
  it("pays a running slot with an approved creative on a verified, active campaign", () => {
    expect(playPays(paid)).toBe(true);
  });

  it("pays nothing for a house card", () => {
    expect(playPays({ ...paid, house: true })).toBe(false);
  });

  it("pays nothing above the daily cap", () => {
    expect(playPays({ ...paid, paidToday: 500 })).toBe(false);
  });

  it("pays the last play under the cap", () => {
    expect(playPays({ ...paid, paidToday: 499 })).toBe(true);
  });

  it("pays a play inside the paid hours of the day", () => {
    const last = hours(economy.caps.paidHoursPerDay - 0.01);
    expect(playPays({ ...paid, firstPlayAt: hours(0), countedAt: last })).toBe(true);
  });

  it("pays nothing once the paid hours of the day are used", () => {
    const closed = hours(economy.caps.paidHoursPerDay);
    expect(playPays({ ...paid, firstPlayAt: hours(0), countedAt: closed })).toBe(false);
  });

  it("opens the paid hours at the first play, not at midnight", () => {
    const late = hours(6 + economy.caps.paidHoursPerDay - 0.01);
    expect(playPays({ ...paid, firstPlayAt: hours(6), countedAt: late })).toBe(true);
  });

  it("pays nothing when the slot is not running", () => {
    for (const slotState of ["booked", "ended", "refunded", null] as const) {
      expect(playPays({ ...paid, slotState })).toBe(false);
    }
  });

  it("pays nothing when the creative lost its approval after the batch was cut", () => {
    expect(playPays({ ...paid, listingState: "rejected" })).toBe(false);
    expect(playPays({ ...paid, listingState: "paused" })).toBe(false);
  });

  it("pays nothing when the campaign is paused or unverified", () => {
    expect(playPays({ ...paid, campaignState: "paused" })).toBe(false);
    expect(playPays({ ...paid, verifiedAt: null })).toBe(false);
  });
});
