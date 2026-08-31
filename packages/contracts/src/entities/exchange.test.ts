import { describe, expect, it } from "vitest";
import { serveOutput } from "../modules/serve";
import { ledgerEntryContract } from "./ledger-entry";
import { placementContract } from "./placement";
import { productContract } from "./product";

describe("exchange entity contracts", () => {
  it("serializes product dates and strips userId", () => {
    const result = productContract.parse({
      id: "p1",
      userId: "u1",
      name: "Acme",
      url: "https://acme.test",
      domain: "acme.test",
      tagline: "Tools for makers",
      logoUrl: null,
      status: "pending",
      rejectionReason: null,
      verificationToken: "tok",
      verifiedAt: null,
      advertise: true,
      showAds: true,
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      updatedAt: new Date("2026-08-02T00:00:00.000Z"),
    });
    expect(result).not.toHaveProperty("userId");
    expect(result.createdAt).toBe("2026-08-01T00:00:00.000Z");
    expect(result.status).toBe("pending");
  });

  it("keeps the api key on the owner placement contract", () => {
    const result = placementContract.parse({
      id: "pl1",
      productId: "p1",
      apiKey: "pk_abc",
      size: "small",
      houseAdPct: 10,
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
    });
    expect(result.apiKey).toBe("pk_abc");
    expect(result.createdAt).toBe("2026-08-01T00:00:00.000Z");
  });

  it("strips the idempotency key from ledger entries", () => {
    const result = ledgerEntryContract.parse({
      id: "l1",
      userId: "u1",
      delta: -2,
      state: "settled",
      reason: "spend",
      impressionId: "i1",
      relatedEntryId: null,
      idempotencyKey: "spend:i1",
      createdAt: new Date("2026-08-01T00:00:00.000Z"),
      settlesAt: null,
      settledAt: new Date("2026-08-01T00:00:00.000Z"),
    });
    expect(result).not.toHaveProperty("idempotencyKey");
    expect(result).not.toHaveProperty("userId");
    expect(result.delta).toBe(-2);
  });

  it("accepts an empty serve response", () => {
    expect(
      serveOutput.parse({ impressionId: null, size: "small", house: false, ad: null }),
    ).toEqual({ impressionId: null, size: "small", house: false, ad: null });
  });
});
