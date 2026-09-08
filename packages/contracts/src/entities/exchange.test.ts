import { describe, expect, it } from "vitest";
import { serveOutput } from "../modules/serve";
import { campaignContract } from "./campaign";
import { deviceAdminContract, deviceContract } from "./device";
import { ledgerEntryContract } from "./ledger-entry";
import { listingContract } from "./listing";
import { placementContract } from "./placement";
import { playContract } from "./play";

describe("exchange entity contracts", () => {
  it("serializes campaign dates and strips userId", () => {
    const result = campaignContract.parse({
      id: "c1",
      userId: "u1",
      name: "Acme",
      url: "https://acme.test",
      domain: "acme.test",
      state: "draft",
      pauseReason: null,
      pausedAt: null,
      dailyBudget: 20_000,
      verificationToken: "tok",
      verifiedAt: null,
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-08-02T00:00:00.000Z"),
    });
    expect(result).not.toHaveProperty("userId");
    expect(result.createdAt).toBe("2026-08-01T00:00:00.000Z");
    expect(result.state).toBe("draft");
    expect(result.pauseReason).toBeNull();
  });

  it("keeps the listing under its campaign and carries no name of its own", () => {
    const result = listingContract.parse({
      id: "l1",
      campaignId: "c1",
      tagline: "Tools for makers",
      logoUrl: null,
      state: "pending",
      rejectionReason: null,
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    });
    expect(result.campaignId).toBe("c1");
    expect(result).not.toHaveProperty("name");
  });

  it("keeps the api key on the owner device contract", () => {
    const result = deviceContract.parse({
      id: "d1",
      userId: "u2",
      name: "Front counter screen",
      deviceId: "CAPY-1234",
      apiKey: "dk_abc",
      venueType: "cafe",
      location: "Front counter",
      photoUrl: "https://cdn.test/screen.jpg",
      promotionName: null,
      promotionTagline: null,
      promotionUrl: null,
      promotionLogoUrl: null,
      tier: "standard",
      state: "approved",
      rejectionReason: null,
      dailyPlayCap: 500,
      approvedAt: new Date("2026-08-01T00:00:00.000Z"),
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    });
    expect(result).not.toHaveProperty("userId");
    expect(result.apiKey).toBe("dk_abc");
    expect(result.approvedAt).toBe("2026-08-01T00:00:00.000Z");
  });

  it("keeps the api key away from an admin reviewing somebody else's device", () => {
    // The moderation queue and both moderation routes serve this shape. An admin
    // is not the owner, and the key is what lets a screen ask for paid listings.
    const result = deviceAdminContract.parse({
      id: "d1",
      userId: "u2",
      name: "Front counter screen",
      deviceId: "CAPY-1234",
      apiKey: "dk_abc",
      venueType: "cafe",
      location: "Front counter",
      photoUrl: "https://cdn.test/screen.jpg",
      promotionName: null,
      promotionTagline: null,
      promotionUrl: null,
      promotionLogoUrl: null,
      tier: "standard",
      state: "pending",
      rejectionReason: null,
      dailyPlayCap: 500,
      approvedAt: null,
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-08-01T00:00:00.000Z"),
    });
    expect(result).not.toHaveProperty("apiKey");
    expect(result).not.toHaveProperty("userId");
    expect(result.location).toBe("Front counter");
  });

  it("carries the placement format, dwell and gap", () => {
    const result = placementContract.parse({
      id: "pl1",
      deviceId: "d1",
      format: "band",
      size: "medium",
      dwellSeconds: 12,
      gapSeconds: 180,
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
    });
    expect(result.format).toBe("band");
    expect(result.dwellSeconds).toBe(12);
  });

  it("carries the play state and the scanned flag", () => {
    const result = playContract.parse({
      id: "p1",
      placementId: "pl1",
      listingId: "l1",
      house: false,
      state: "counted",
      scanned: true,
      expiresAt: new Date("2026-08-01T00:10:00.000Z"),
      countedAt: new Date("2026-08-01T00:00:00.000Z"),
      scannedAt: new Date("2026-08-01T00:01:00.000Z"),
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
    });
    expect(result.state).toBe("counted");
    expect(result.scannedAt).toBe("2026-08-01T00:01:00.000Z");
  });

  it("keeps the lot and strips the idempotency key from ledger entries", () => {
    const result = ledgerEntryContract.parse({
      id: "le1",
      userId: "u1",
      delta: -6,
      state: "settled",
      reason: "spend",
      lot: "bought",
      playId: "p1",
      relatedEntryId: null,
      idempotencyKey: "spend:bought:p1",
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      settlesAt: null,
      settledAt: new Date("2026-08-01T00:00:00.000Z"),
    });
    expect(result).not.toHaveProperty("idempotencyKey");
    expect(result).not.toHaveProperty("userId");
    expect(result.lot).toBe("bought");
    expect(result.delta).toBe(-6);
  });

  it("accepts an empty serve response", () => {
    const empty = {
      playId: null,
      format: "band" as const,
      size: "medium" as const,
      dwellSeconds: 12,
      gapSeconds: 180,
      house: false,
      listing: null,
      promotion: null,
    };
    expect(serveOutput.parse(empty)).toEqual(empty);
  });
});
