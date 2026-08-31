import { release } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import { describe, expect, it } from "vitest";
import { releaseContract } from "./release";
import { subscriptionContract } from "./subscription";

describe("derived entity contracts", () => {
  it("serializes release Dates to ISO strings", () => {
    const result = releaseContract.parse({
      id: "1",
      tag: "v1.0.0",
      name: "First",
      body: null,
      url: "https://example.com/1",
      prerelease: false,
      publishedAt: new Date("2026-02-03T00:00:00.000Z"),
      syncedAt: new Date("2026-02-04T00:00:00.000Z"),
    });
    expect(result).toEqual({
      id: "1",
      tag: "v1.0.0",
      name: "First",
      body: null,
      url: "https://example.com/1",
      prerelease: false,
      publishedAt: "2026-02-03T00:00:00.000Z",
      syncedAt: "2026-02-04T00:00:00.000Z",
    });
  });

  it("strips Stripe identifiers from a subscription row", () => {
    const result = subscriptionContract.parse({
      id: "sub_row_1",
      userId: "user_1",
      stripeCustomerId: "cus_secret",
      stripeSubscriptionId: "sub_secret",
      stripePriceId: "price_1",
      stripeCurrentPeriodEnd: new Date("2026-08-01T00:00:00.000Z"),
      status: "active",
      cancelAtPeriodEnd: false,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    expect(result).toEqual({
      id: "sub_row_1",
      status: "active",
      stripePriceId: "price_1",
      stripeCurrentPeriodEnd: "2026-08-01T00:00:00.000Z",
      cancelAtPeriodEnd: false,
    });
    expect(result).not.toHaveProperty("stripeCustomerId");
    expect(result).not.toHaveProperty("stripeSubscriptionId");
  });

  it("throws at construction when a picked column no longer exists on the table", () => {
    // Guards the allowlist's protective property: TypeScript does NOT catch a stale
    // pick key when other valid keys are present, so this runtime throw is the alarm.
    // `as never` is required and sanctioned here ONLY to get past the type layer so this
    // test can exercise the runtime guard — do not "clean up" by removing it.
    expect(() =>
      createSelectSchema(release).pick({ id: true, tag: true, noSuchColumn: true } as never),
    ).toThrow(/Unrecognized key/);
  });
});
