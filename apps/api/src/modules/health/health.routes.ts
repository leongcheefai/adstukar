import { healthStatusOutput } from "@repo/contracts";
import { Hono } from "hono";
import type * as z from "zod/v4";

export const healthRouter = new Hono();

healthRouter.get("/", (c) =>
  c.json(healthStatusOutput.parse({ ok: true } satisfies z.input<typeof healthStatusOutput>)),
);
