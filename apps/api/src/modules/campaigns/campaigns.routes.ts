import { zValidator } from "@hono/zod-validator";
import {
  archiveCampaignOutput,
  campaignOutput,
  createCampaignInput,
  listCampaignsOutput,
  updateCampaignInput,
  verifyCampaignOutput,
} from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import {
  archiveCampaign,
  createCampaign,
  listCampaigns,
  updateCampaign,
  verifyCampaign,
} from "./campaigns.service";

export const campaignsRouter = new Hono<{ Variables: AppVariables }>();

campaignsRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const rows = await listCampaigns(user.id);
  return c.json(listCampaignsOutput.parse(rows satisfies z.input<typeof listCampaignsOutput>));
});

campaignsRouter.post("/", zValidator("json", createCampaignInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await createCampaign(user.id, c.req.valid("json"));
  return c.json(campaignOutput.parse(row satisfies z.input<typeof campaignOutput>), 201);
});

campaignsRouter.patch("/:id", zValidator("json", updateCampaignInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await updateCampaign(user.id, c.req.param("id"), c.req.valid("json"));
  return c.json(campaignOutput.parse(row satisfies z.input<typeof campaignOutput>));
});

campaignsRouter.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const result = await archiveCampaign(user.id, c.req.param("id"));
  return c.json(
    archiveCampaignOutput.parse(result satisfies z.input<typeof archiveCampaignOutput>),
  );
});

campaignsRouter.post("/:id/verify", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const result = await verifyCampaign(user.id, c.req.param("id"));
  return c.json(verifyCampaignOutput.parse(result satisfies z.input<typeof verifyCampaignOutput>));
});
