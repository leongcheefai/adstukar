import { auth } from "@repo/auth";
import type { MiddlewareHandler } from "hono";
import type { AppVariables } from "../lib/context";

export const sessionMiddleware: MiddlewareHandler<{ Variables: AppVariables }> = async (
  c,
  next,
) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);
  await next();
};
