import { db, schema } from "@repo/db";
import { eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { beforeEach, describe, expect, it } from "vitest";
import { makeMember, makeSlot, truncateAll } from "../../test/fixtures";
import { updateListing } from "../listings/listings.service";
import { updateCampaign } from "./campaigns.service";

/**
 * A slot does not pause (KEV-31). The member paid for a position on the ring
 * for a term, and the term runs to its end. The exits are an edit, which sends
 * the creative back to review, and an archive.
 */
describe("a slot does not pause", () => {
  beforeEach(truncateAll);

  it("refuses to pause the campaign of a running slot", async () => {
    const member = await makeMember();
    const { campaign } = await makeSlot(member.id, { slotState: "running" });

    await expect(updateCampaign(member.id, campaign.id, { state: "paused" })).rejects.toThrow(
      HTTPException,
    );
    const [row] = await db
      .select()
      .from(schema.campaign)
      .where(eq(schema.campaign.id, campaign.id));
    expect(row?.state).toBe("active");
  });

  it("refuses to pause the campaign of a booked slot", async () => {
    const member = await makeMember();
    const { campaign } = await makeSlot(member.id, {
      slotState: "booked",
      listingState: "pending",
    });

    await expect(updateCampaign(member.id, campaign.id, { state: "paused" })).rejects.toThrow(
      HTTPException,
    );
  });

  it("refuses to pause the creative of a running slot", async () => {
    const member = await makeMember();
    const { listing } = await makeSlot(member.id, { slotState: "running" });

    await expect(updateListing(member.id, listing.id, { state: "paused" })).rejects.toThrow(
      HTTPException,
    );
    const [row] = await db.select().from(schema.listing).where(eq(schema.listing.id, listing.id));
    expect(row?.state).toBe("approved");
  });

  it("still pauses a campaign whose slot has ended", async () => {
    const member = await makeMember();
    const { campaign } = await makeSlot(member.id, { slotState: "ended" });

    const item = await updateCampaign(member.id, campaign.id, { state: "paused" });

    expect(item.campaign.state).toBe("paused");
  });

  it("still lets a name change through on a running slot", async () => {
    const member = await makeMember();
    const { campaign } = await makeSlot(member.id, { slotState: "running" });

    const item = await updateCampaign(member.id, campaign.id, { name: "Acme Tools" });

    expect(item.campaign.name).toBe("Acme Tools");
  });
});
