import { beforeEach, describe, expect, it } from "vitest";
import { makeDevice, makeMember, makeSlot, truncateAll } from "../../test/fixtures";
import { serveListing } from "./serve.service";

/** What a venue screen is handed: a running slot, or the house card. */
describe("serveListing", () => {
  beforeEach(truncateAll);

  it("plays a running slot", async () => {
    const advertiser = await makeMember();
    const distributor = await makeMember();
    const { campaign } = await makeSlot(advertiser.id);
    const { device } = await makeDevice(distributor.id);

    const served = await serveListing({ key: device.apiKey });

    expect(served.house).toBe(false);
    expect(served.listing?.name).toBe(campaign.name);
    expect(served.playId).not.toBeNull();
  });

  it.each(["booked", "ended", "refunded"] as const)(
    "plays the house card when the slot is %s",
    async (slotState) => {
      const advertiser = await makeMember();
      const distributor = await makeMember();
      await makeSlot(advertiser.id, { slotState });
      const { device } = await makeDevice(distributor.id);

      const served = await serveListing({ key: device.apiKey });

      expect(served.house).toBe(true);
      expect(served.listing).toBeNull();
    },
  );

  it("never plays the device owner's own slot", async () => {
    const member = await makeMember();
    await makeSlot(member.id);
    const { device } = await makeDevice(member.id);

    const served = await serveListing({ key: device.apiKey });

    expect(served.house).toBe(true);
  });

  it("plays the house card when the creative is not approved", async () => {
    const advertiser = await makeMember();
    const distributor = await makeMember();
    await makeSlot(advertiser.id, { listingState: "pending" });
    const { device } = await makeDevice(distributor.id);

    expect((await serveListing({ key: device.apiKey })).house).toBe(true);
  });
});
