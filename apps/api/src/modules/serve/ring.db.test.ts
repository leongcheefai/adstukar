import { earnPerPlay } from "@repo/config/economy";
import { db, schema } from "@repo/db";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, it } from "vitest";
import { ledgerOf, makeDevice, makeMember, makeSlot, truncateAll } from "../../test/fixtures";
import { recordReport, serveRing } from "./serve.service";

function brandPlays(ring: Awaited<ReturnType<typeof serveRing>>) {
  return ring.laps.flatMap((lap) =>
    lap.bands.flatMap((band) => (band.kind === "brand" && band.playId ? [band.playId] : [])),
  );
}

/** What a registered set is handed: its review state, or the ring with a play per brand. */
describe("serveRing", () => {
  beforeEach(truncateAll);

  it("answers 404 for a key it does not know", async () => {
    await expect(serveRing({ key: "dk_nobody" })).rejects.toBeInstanceOf(HTTPException);
  });

  it("answers 404 for an archived screen", async () => {
    const owner = await makeMember();
    const { device } = await makeDevice(owner.id, { format: "ticker", state: "archived" });

    await expect(serveRing({ key: device.apiKey })).rejects.toBeInstanceOf(HTTPException);
  });

  it("tells a pending screen where it stands, and opens nothing", async () => {
    const advertiser = await makeMember();
    await makeSlot(advertiser.id);
    const owner = await makeMember();
    const { device } = await makeDevice(owner.id, { format: "ticker", state: "pending" });

    const ring = await serveRing({ key: device.apiKey });

    expect(ring).toEqual({ state: "pending", rejectionReason: null, laps: [] });
    expect(await db.select().from(schema.play)).toHaveLength(0);
  });

  it("gives a rejected screen its reason", async () => {
    const owner = await makeMember();
    const { device } = await makeDevice(owner.id, {
      format: "ticker",
      state: "rejected",
      rejectionReason: "The photo shows a living room.",
    });

    const ring = await serveRing({ key: device.apiKey });

    expect(ring.state).toBe("rejected");
    expect(ring.rejectionReason).toBe("The photo shows a living room.");
    expect(ring.laps).toEqual([]);
  });

  it("opens one play per brand per lap, on the ticker region", async () => {
    const advertiser = await makeMember();
    await makeSlot(advertiser.id, { position: 1 });
    const owner = await makeMember();
    const { device, placement } = await makeDevice(owner.id, { format: "ticker" });

    const ring = await serveRing({ key: device.apiKey, laps: 3 });

    expect(ring.laps).toHaveLength(3);
    expect(ring.laps[0]?.bands[0]).toMatchObject({ position: 1, kind: "brand", name: "Acme" });
    expect(ring.laps[0]?.bands[1]).toEqual({ position: 2, kind: "open" });
    const ids = brandPlays(ring);
    expect(new Set(ids).size).toBe(3);
    const opened = await db
      .select()
      .from(schema.play)
      .where(eq(schema.play.placementId, placement.id));
    expect(opened.map((p) => p.id).sort()).toEqual([...ids].sort());
  });

  it("opens nothing for the owner's own brand", async () => {
    const owner = await makeMember();
    await makeSlot(owner.id, { position: 1 });
    const { device } = await makeDevice(owner.id, { format: "ticker" });

    const ring = await serveRing({ key: device.apiKey, laps: 2 });

    expect(ring.laps[0]?.bands[0]).toMatchObject({
      kind: "brand",
      playId: null,
      expiresAt: null,
    });
    expect(await db.select().from(schema.play)).toHaveLength(0);
  });

  it("answers 404 for an approved screen with no ticker region", async () => {
    const owner = await makeMember();
    const { device } = await makeDevice(owner.id, { format: "band" });

    await expect(serveRing({ key: device.apiKey })).rejects.toBeInstanceOf(HTTPException);
  });

  it("pays one unit for a reported crossing, and nothing above the cap", async () => {
    const advertiser = await makeMember();
    await makeSlot(advertiser.id, { position: 1 });
    const owner = await makeMember();
    const { device } = await makeDevice(owner.id, { format: "ticker", dailyPlayCap: 1 });
    const [first, second] = brandPlays(await serveRing({ key: device.apiKey, laps: 2 }));
    if (!first || !second) throw new Error("no plays opened");

    expect((await recordReport({ playId: first, key: device.apiKey })).counted).toBe(true);
    expect((await recordReport({ playId: second, key: device.apiKey })).counted).toBe(true);

    const earned = (await ledgerOf(owner.id)).filter((row) => row.reason === "earn");
    expect(earned).toHaveLength(1);
    expect(earned[0]?.delta).toBe(1);
    expect(earnPerPlay()).toBe(1);
  });
});
