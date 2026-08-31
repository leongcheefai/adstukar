import { listReleasesOutput, syncReleasesOutput } from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import { listReleases, syncReleases } from "./releases.service";

export const releasesRouter = new Hono<{ Variables: AppVariables }>();

releasesRouter.get("/", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const releases = await listReleases();
  return c.json(listReleasesOutput.parse(releases satisfies z.input<typeof listReleasesOutput>));
});

releasesRouter.post("/sync", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  if (user.role !== "admin") throw new HTTPException(403, { message: "Forbidden" });
  const result = await syncReleases();
  return c.json(syncReleasesOutput.parse(result satisfies z.input<typeof syncReleasesOutput>));
});
