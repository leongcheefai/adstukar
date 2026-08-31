import { meHasPasswordOutput, meUserOutput } from "@repo/contracts";
import { db } from "@repo/db";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";

export const meRouter = new Hono<{ Variables: AppVariables }>();

meRouter.get("/", (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  // `satisfies` proves Better Auth's user shape still matches the contract at compile
  // time — a shape change fails typecheck rather than 500ing in production.
  return c.json(meUserOutput.parse({ user } satisfies z.input<typeof meUserOutput>));
});

meRouter.get("/has-password", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });

  const account = await db.query.account.findFirst({
    where: (acc, { and, eq }) => and(eq(acc.userId, user.id), eq(acc.providerId, "credential")),
  });

  return c.json(meHasPasswordOutput.parse({ hasPassword: account !== undefined }));
});
