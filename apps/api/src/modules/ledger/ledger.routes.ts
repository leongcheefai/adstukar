import { zValidator } from "@hono/zod-validator";
import { listLedgerOutput, listLedgerQuery } from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import { listEntries } from "./ledger.service";

export const ledgerRouter = new Hono<{ Variables: AppVariables }>();

ledgerRouter.get("/", zValidator("query", listLedgerQuery), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const result = await listEntries(user.id, c.req.valid("query"));
  return c.json(listLedgerOutput.parse(result satisfies z.input<typeof listLedgerOutput>));
});
