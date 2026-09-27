import { db, schema } from "@repo/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { makeDevice, makeMember, makeSlot, truncateAll } from "../../test/fixtures";
import { recordReport, serveListing } from "../serve/serve.service";
import { SCREEN_ONLINE_WINDOW_MS, getNetworkStats } from "./stats.service";

/** The figures are cached, so each read steps well past the cache's life. */
let clock = Date.UTC(2030, 0, 1);
function later(): Date {
  clock += 3_600_000;
  return new Date(clock);
}

async function seen(deviceId: string, at: Date, state: "approved" | "pending" | "archived") {
  await db
    .update(schema.device)
    .set({ lastSeenAt: at, state })
    .where(eq(schema.device.id, deviceId));
}

describe("getNetworkStats", () => {
  beforeEach(truncateAll);

  it("counts paid plays and leaves house cards out", async () => {
    const distributor = await makeMember();
    const { device } = await makeDevice(distributor.id);

    // Nothing is booked yet, so the screen plays a house card.
    const house = await serveListing({ key: device.apiKey });
    if (!house.playId) throw new Error("no house play");
    await recordReport({ playId: house.playId, key: device.apiKey });

    await makeSlot((await makeMember()).id);
    const paid = await serveListing({ key: device.apiKey, now: new Date(Date.now() + 60_000) });
    if (!paid.playId) throw new Error("no paid play");
    await recordReport({
      playId: paid.playId,
      key: device.apiKey,
      now: new Date(Date.now() + 60_000),
    });

    expect((await getNetworkStats(later())).plays).toBe(1);
  });

  it("counts approved screens that reported inside the window", async () => {
    const owner = await makeMember();
    const now = later();
    const inside = new Date(now.getTime() - SCREEN_ONLINE_WINDOW_MS + 1_000);
    const outside = new Date(now.getTime() - SCREEN_ONLINE_WINDOW_MS - 1_000);

    const live = await makeDevice(owner.id);
    await seen(live.device.id, inside, "approved");
    const quiet = await makeDevice(owner.id);
    await seen(quiet.device.id, outside, "approved");
    const pending = await makeDevice(owner.id);
    await seen(pending.device.id, now, "pending");
    const archived = await makeDevice(owner.id);
    await seen(archived.device.id, now, "archived");
    await makeDevice(owner.id); // approved, never reported

    expect((await getNetworkStats(now)).screensOnline).toBe(1);
  });
});
