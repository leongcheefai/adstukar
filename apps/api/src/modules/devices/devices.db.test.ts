import { db, schema } from "@repo/db";
import { eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { makeMember, truncateAll } from "../../test/fixtures";
import { createDevice } from "./devices.service";

describe("createDevice", () => {
  beforeEach(truncateAll);

  it("gives the new screen one ticker region, which the crawl plays on", async () => {
    const member = await makeMember();

    const { device } = await createDevice(member.id, {
      name: "Counter TV",
      location: "Jalan Telawi 3, Bangsar",
      venueType: "cafe",
      photoUrl: "https://cdn.test/device-photos/a.jpg",
    });

    const regions = await db
      .select()
      .from(schema.placement)
      .where(eq(schema.placement.deviceId, device.id));
    expect(regions).toHaveLength(1);
    expect(regions[0]?.format).toBe("ticker");
    expect(device.state).toBe("pending");
  });
});
