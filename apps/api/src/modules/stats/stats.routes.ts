import { statsOverviewOutput } from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import { getStatsOverview } from "./stats.service";

export const statsRouter = new Hono<{ Variables: AppVariables }>();

statsRouter.get("/overview", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const result = await getStatsOverview(user.id);
  return c.json(statsOverviewOutput.parse(result satisfies z.input<typeof statsOverviewOutput>));
});
