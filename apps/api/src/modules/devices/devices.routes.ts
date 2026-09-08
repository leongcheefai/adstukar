import { zValidator } from "@hono/zod-validator";
import {
  archiveDeviceOutput,
  createDeviceInput,
  deviceWithTermsOutput,
  listDevicesOutput,
  listEligibleListingsOutput,
  setExcludedTermsInput,
  setPromotionInput,
  setVetoedListingsInput,
  updateDeviceInput,
} from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import {
  archiveDevice,
  createDevice,
  listDevices,
  listEligibleListings,
  rotateApiKey,
  setExcludedTerms,
  setPromotion,
  setVetoedListings,
  updateDevice,
} from "./devices.service";

export const devicesRouter = new Hono<{ Variables: AppVariables }>();

devicesRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const rows = await listDevices(user.id);
  return c.json(listDevicesOutput.parse(rows satisfies z.input<typeof listDevicesOutput>));
});

devicesRouter.post("/", zValidator("json", createDeviceInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await createDevice(user.id, c.req.valid("json"));
  return c.json(
    deviceWithTermsOutput.parse(row satisfies z.input<typeof deviceWithTermsOutput>),
    201,
  );
});

devicesRouter.patch("/:id", zValidator("json", updateDeviceInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await updateDevice(user.id, c.req.param("id"), c.req.valid("json"));
  return c.json(deviceWithTermsOutput.parse(row satisfies z.input<typeof deviceWithTermsOutput>));
});

devicesRouter.post("/:id/rotate-key", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await rotateApiKey(user.id, c.req.param("id"));
  return c.json(deviceWithTermsOutput.parse(row satisfies z.input<typeof deviceWithTermsOutput>));
});

devicesRouter.put("/:id/excluded-terms", zValidator("json", setExcludedTermsInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await setExcludedTerms(user.id, c.req.param("id"), c.req.valid("json"));
  return c.json(deviceWithTermsOutput.parse(row satisfies z.input<typeof deviceWithTermsOutput>));
});

devicesRouter.get("/:id/eligible-listings", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const rows = await listEligibleListings(user.id, c.req.param("id"));
  return c.json(
    listEligibleListingsOutput.parse(rows satisfies z.input<typeof listEligibleListingsOutput>),
  );
});

devicesRouter.put("/:id/vetoes", zValidator("json", setVetoedListingsInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await setVetoedListings(user.id, c.req.param("id"), c.req.valid("json"));
  return c.json(deviceWithTermsOutput.parse(row satisfies z.input<typeof deviceWithTermsOutput>));
});

devicesRouter.put("/:id/promotion", zValidator("json", setPromotionInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await setPromotion(user.id, c.req.param("id"), c.req.valid("json"));
  return c.json(deviceWithTermsOutput.parse(row satisfies z.input<typeof deviceWithTermsOutput>));
});

devicesRouter.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const result = await archiveDevice(user.id, c.req.param("id"));
  return c.json(archiveDeviceOutput.parse(result satisfies z.input<typeof archiveDeviceOutput>));
});
