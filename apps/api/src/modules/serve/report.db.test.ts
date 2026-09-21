import { earnPerPlay } from "@repo/config/economy";
import { db, schema } from "@repo/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { ledgerOf, makeDevice, makeMember, makeSlot, truncateAll } from "../../test/fixtures";
import { recordReport, recordScan, serveListing } from "./serve.service";

/** One play, served and reported, on a fresh screen. */
async function servedPlay(opts: Parameters<typeof makeDevice>[1] = {}) {
  const advertiser = await makeMember();
  const distributor = await makeMember();
  const booking = await makeSlot(advertiser.id);
  const { device } = await makeDevice(distributor.id, opts);
  const served = await serveListing({ key: device.apiKey });
  if (!served.playId) throw new Error("no play served");
  return { advertiser, distributor, device, playId: served.playId, ...booking };
}

describe("recordReport", () => {
  beforeEach(truncateAll);

  it("posts one pending earn at the device's tier rate, and nothing else", async () => {
    const { distributor, advertiser, device, playId } = await servedPlay({ tier: "premium" });

    const result = await recordReport({ playId, key: device.apiKey });

    expect(result.counted).toBe(true);
    const rows = await ledgerOf(distributor.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      reason: "earn",
      lot: "earned",
      state: "pending",
      delta: earnPerPlay("premium"),
      playId,
    });
    expect(await ledgerOf(advertiser.id)).toHaveLength(0);
  });

  it("posts nothing twice on a retry", async () => {
    const { distributor, device, playId } = await servedPlay();

    await recordReport({ playId, key: device.apiKey });
    const retry = await recordReport({ playId, key: device.apiKey });

    expect(retry.counted).toBe(false);
    expect(await ledgerOf(distributor.id)).toHaveLength(1);
  });

  it("counts a play above the daily cap and pays nothing for it", async () => {
    const { distributor, device, playId } = await servedPlay({ dailyPlayCap: 1, gapSeconds: 30 });
    await recordReport({ playId, key: device.apiKey });

    const later = new Date(Date.now() + 60_000);
    const second = await serveListing({ key: device.apiKey, now: later });
    if (!second.playId) throw new Error("no second play");
    const result = await recordReport({ playId: second.playId, key: device.apiKey, now: later });

    expect(result.counted).toBe(true);
    expect(await ledgerOf(distributor.id)).toHaveLength(1);
  });

  it("pays nothing when the slot ended between serve and report", async () => {
    const { distributor, device, playId, slot } = await servedPlay();
    await db.update(schema.slot).set({ state: "ended" }).where(eq(schema.slot.id, slot.id));

    const result = await recordReport({ playId, key: device.apiKey });

    expect(result.counted).toBe(true);
    expect(await ledgerOf(distributor.id)).toHaveLength(0);
  });

  it("moves nothing when the key does not match the screen", async () => {
    const { distributor, playId } = await servedPlay();

    const result = await recordReport({ playId, key: "dk-wrong" });

    expect(result.counted).toBe(false);
    expect(await ledgerOf(distributor.id)).toHaveLength(0);
  });
});

describe("recordScan", () => {
  beforeEach(truncateAll);

  it("marks the play scanned, redirects, and posts no ledger row", async () => {
    const { distributor, advertiser, device, playId, campaign } = await servedPlay();
    await recordReport({ playId, key: device.apiKey });

    const url = await recordScan(playId);

    expect(url).toBe(campaign.url);
    const [play] = await db.select().from(schema.play).where(eq(schema.play.id, playId));
    expect(play?.scanned).toBe(true);
    expect(await ledgerOf(distributor.id)).toHaveLength(1);
    expect(await ledgerOf(advertiser.id)).toHaveLength(0);
  });
});
