import { db, schema } from "@repo/db";
import { beforeEach, describe, expect, it } from "vitest";
import { ledgerOf, makeMember, makeSlot, truncateAll } from "../../test/fixtures";
import { approveListing } from "./admin.service";
import { weekPool } from "./pool.service";

describe("approveListing", () => {
  beforeEach(truncateAll);

  it("grants nothing on a member's first approval", async () => {
    const advertiser = await makeMember();
    const { listing } = await makeSlot(advertiser.id, {
      listingState: "pending",
      slotState: "booked",
    });

    const row = await approveListing(listing.id);

    expect(row.state).toBe("approved");
    expect(await ledgerOf(advertiser.id)).toHaveLength(0);
  });
});

describe("weekPool", () => {
  beforeEach(truncateAll);

  it("sums the week's slot revenue and the week's earn, and skips a voided earn", async () => {
    const advertiser = await makeMember();
    const distributor = await makeMember();
    const now = new Date("2026-09-24T12:00:00Z");
    const inWeek = new Date("2026-09-22T00:00:00Z");

    // Two bookings this week: one live, one refunded. Only the live one is revenue.
    await makeSlot(advertiser.id, { position: 1 });
    await makeSlot(advertiser.id, { position: 2, slotState: "refunded" });
    await db.update(schema.slot).set({ bookedAt: inWeek });

    const earn = (delta: number, key: string, state: "pending" | "void") =>
      db.insert(schema.ledgerEntry).values({
        id: crypto.randomUUID(),
        userId: distributor.id,
        delta,
        reason: "earn",
        lot: "earned",
        state,
        idempotencyKey: key,
        createdAt: inWeek,
      });
    await earn(2, "earn:a", "pending");
    await earn(3, "earn:b", "pending");
    await earn(4, "earn:c", "void");

    const pool = await weekPool(now);

    expect(pool.weekStart.toISOString()).toBe("2026-09-21T00:00:00.000Z");
    expect(pool.slotRevenue).toBe(20_000);
    expect(pool.earnPosted).toBe(5);
  });
});
