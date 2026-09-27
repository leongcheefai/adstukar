import { accountClosable } from "@repo/auth";
import { db, schema } from "@repo/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { makeDevice, makeMember, makeSlot, truncateAll } from "../../test/fixtures";
import { recordReport, serveListing } from "../serve/serve.service";

describe("accountClosable", () => {
  beforeEach(truncateAll);

  it("lets a member who never moved money or played delete their account", async () => {
    const member = await makeMember();
    await makeDevice(member.id);

    expect(await accountClosable(member.id)).toBe(true);
  });

  it("refuses a distributor whose screen earned, and the ledger refuses the delete too", async () => {
    const advertiser = await makeMember();
    const distributor = await makeMember();
    await makeSlot(advertiser.id);
    const { device } = await makeDevice(distributor.id);
    const served = await serveListing({ key: device.apiKey });
    if (!served.playId) throw new Error("no play served");
    await recordReport({ playId: served.playId, key: device.apiKey });

    expect(await accountClosable(distributor.id)).toBe(false);
    await expect(
      db.delete(schema.user).where(eq(schema.user.id, distributor.id)),
    ).rejects.toThrow();
  });

  it("refuses a screen that only ever played house cards", async () => {
    const distributor = await makeMember();
    const { device } = await makeDevice(distributor.id);
    const served = await serveListing({ key: device.apiKey });
    if (!served.playId) throw new Error("no play served");

    expect(await accountClosable(distributor.id)).toBe(false);
  });
});
