import { presetListOutput } from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import { listPresets } from "./presets.service";

export const presetsRouter = new Hono<{ Variables: AppVariables }>();

/**
 * The wallpaper collections an admin put on every member's set, and their
 * photos. Any member reads them; only an admin adds, edits, moves, or removes
 * one (`/admin/presets`).
 */
presetsRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const list = await listPresets();
  return c.json(presetListOutput.parse(list satisfies z.input<typeof presetListOutput>));
});
