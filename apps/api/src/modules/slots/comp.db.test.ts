import { earnPerPlay, economy, slotPrice } from "@repo/config/economy";
import { db, schema } from "@repo/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { ledgerOf, makeDevice, makeMember, makeSlot, truncateAll } from "../../test/fixtures";
import { approveListing, rejectListing } from "../admin/admin.service";
import { weekPool } from "../admin/pool.service";
import { recordReport, serveListing } from "../serve/serve.service";
import { bookSlot, compSlot, listCompedSlots } from "./slots.service";

const ad = (position: number) => ({
  name: "Friend Co",
  url: "https://friend.test/",
  tagline: "Made next door",
  position,
});

describe("compSlot", () => {
  beforeEach(truncateAll);

  it("opens a booked slot for the member with no charge and no ledger row", async () => {
    const admin = await makeMember("admin");
    const friend = await makeMember();

    const { slot, campaign, listing, owner } = await compSlot(admin.id, {
      ...ad(3),
      email: friend.email,
    });

    expect(slot).toMatchObject({
      userId: friend.id,
      position: 3,
      state: "booked",
      amount: 0,
      comped: true,
      compedBy: admin.id,
    });
    expect(campaign.userId).toBe(friend.id);
    // The admin named the destination, so the domain needs no token from the
    // member; the review is the one gate left.
    expect(campaign.verifiedAt).not.toBeNull();
    expect(campaign.state).toBe("active");
    expect(listing?.state).toBe("pending");
    expect(owner.email).toBe(friend.email);
    expect(await ledgerOf(friend.id)).toHaveLength(0);
    expect((await weekPool()).slotRevenue).toBe(0);
  });

  it("refuses an email nobody signed up with", async () => {
    const admin = await makeMember("admin");
    await expect(
      compSlot(admin.id, { ...ad(1), email: "nobody@test.local" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("refuses a position a paid slot holds", async () => {
    const admin = await makeMember("admin");
    const friend = await makeMember();
    const payer = await makeMember();
    await makeSlot(payer.id, { position: 2 });

    await expect(compSlot(admin.id, { ...ad(2), email: friend.email })).rejects.toMatchObject({
      status: 409,
    });
  });

  it("stops at the cap, and an ended comp gives its place back", async () => {
    const admin = await makeMember("admin");
    const friend = await makeMember();
    const max = economy.slot.compMax;
    for (let position = 1; position <= max; position++) {
      await compSlot(admin.id, { ...ad(position), email: friend.email });
    }

    await expect(compSlot(admin.id, { ...ad(max + 1), email: friend.email })).rejects.toMatchObject(
      { status: 409 },
    );
    expect((await listCompedSlots()).left).toBe(0);

    await db.update(schema.slot).set({ state: "ended" }).where(eq(schema.slot.position, 1));

    const listed = await listCompedSlots();
    expect(listed.items).toHaveLength(max - 1);
    expect(listed.left).toBe(1);
    await compSlot(admin.id, { ...ad(max + 1), email: friend.email });
  });

  it("runs once the review approves it, and pays the screen that plays it", async () => {
    const admin = await makeMember("admin");
    const friend = await makeMember();
    const distributor = await makeMember();
    const { slot, listing } = await compSlot(admin.id, { ...ad(1), email: friend.email });
    if (!listing) throw new Error("comp opened no listing");

    await approveListing(listing.id);

    const [row] = await db.select().from(schema.slot).where(eq(schema.slot.id, slot.id));
    expect(row?.state).toBe("running");

    const { device } = await makeDevice(distributor.id);
    const served = await serveListing({ key: device.apiKey });
    if (!served.playId) throw new Error("no play served");
    await recordReport({ playId: served.playId, key: device.apiKey });

    const earned = await ledgerOf(distributor.id);
    expect(earned).toHaveLength(1);
    expect(earned[0]).toMatchObject({ reason: "earn", delta: earnPerPlay() });
    expect(await ledgerOf(friend.id)).toHaveLength(0);
  });

  it("closes on a rejection with nothing to give back", async () => {
    const admin = await makeMember("admin");
    const friend = await makeMember();
    const { slot, listing } = await compSlot(admin.id, { ...ad(1), email: friend.email });
    if (!listing) throw new Error("comp opened no listing");

    await rejectListing(listing.id, "Not a fit");

    const [row] = await db.select().from(schema.slot).where(eq(schema.slot.id, slot.id));
    expect(row?.state).toBe("refunded");
    expect(await ledgerOf(friend.id)).toHaveLength(0);
  });
});

describe("bookSlot", () => {
  beforeEach(truncateAll);

  it("still charges the price and opens a paid slot", async () => {
    const payer = await makeMember();
    await db.insert(schema.ledgerEntry).values({
      id: crypto.randomUUID(),
      userId: payer.id,
      delta: slotPrice(),
      reason: "topup",
      lot: "bought",
      state: "settled",
      idempotencyKey: "topup:test",
    });

    const { slot } = await bookSlot(payer.id, ad(1));

    expect(slot).toMatchObject({ amount: slotPrice(), comped: false, compedBy: null });
    const spent = (await ledgerOf(payer.id)).filter((e) => e.reason === "spend");
    expect(spent.reduce((sum, e) => sum + e.delta, 0)).toBe(-slotPrice());
  });
});
