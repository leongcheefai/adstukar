import { zValidator } from "@hono/zod-validator";
import {
  createPlacementInput,
  deletePlacementOutput,
  listPlacementsOutput,
  listPlacementsQuery,
  placementOutput,
  updatePlacementInput,
} from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import {
  createPlacement,
  deletePlacement,
  listPlacements,
  updatePlacement,
} from "./placements.service";

export const placementsRouter = new Hono<{ Variables: AppVariables }>();

placementsRouter.get("/", zValidator("query", listPlacementsQuery), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const rows = await listPlacements(user.id, c.req.valid("query").deviceId);
  return c.json(listPlacementsOutput.parse(rows satisfies z.input<typeof listPlacementsOutput>));
});

placementsRouter.post("/", zValidator("json", createPlacementInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await createPlacement(user.id, c.req.valid("json"));
  return c.json(placementOutput.parse(row satisfies z.input<typeof placementOutput>), 201);
});

placementsRouter.patch("/:id", zValidator("json", updatePlacementInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const row = await updatePlacement(user.id, c.req.param("id"), c.req.valid("json"));
  return c.json(placementOutput.parse(row satisfies z.input<typeof placementOutput>));
});

placementsRouter.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const result = await deletePlacement(user.id, c.req.param("id"));
  return c.json(
    deletePlacementOutput.parse(result satisfies z.input<typeof deletePlacementOutput>),
  );
});
