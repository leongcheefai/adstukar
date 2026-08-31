import type { ErrorHandler } from "hono";
import { HTTPException } from "hono/http-exception";
import { ZodError, flattenError } from "zod/v4";
import { log } from "../lib/logger";

export const errorHandler: ErrorHandler = (err, c) => {
  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }
  // A ZodError here is a response that failed its own contract — a server bug.
  // Log the issues in readable form; the client still gets a generic 500.
  // Imported from zod/v4 deliberately: @repo/contracts is built on the v4
  // dialect, so a v3 ZodError class would never instanceof-match what it throws.
  if (err instanceof ZodError) {
    log("error", "Response contract violation", {
      path: c.req.path,
      method: c.req.method,
      // z.flattenError(err), not err.flatten() — the latter is deprecated in v4.
      issues: flattenError(err),
    });
    return c.json({ error: "Internal server error" }, 500);
  }
  log("error", "Unhandled error", { message: err.message, stack: err.stack });
  return c.json({ error: "Internal server error" }, 500);
};
