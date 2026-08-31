import { metricsOverviewOutput } from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import { getMetricsOverview } from "./metrics.service";

export const metricsRouter = new Hono<{ Variables: AppVariables }>();

metricsRouter.get("/overview", (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  return c.json(
    metricsOverviewOutput.parse(
      getMetricsOverview() satisfies z.input<typeof metricsOverviewOutput>,
    ),
  );
});
