import { auth } from "@repo/auth";
import { serverEnv } from "@repo/env";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { sessionMiddleware } from "../middleware/auth";
import { errorHandler } from "../middleware/error";
import { billingRouter } from "../modules/billing/billing.routes";
import { feedbackRouter } from "../modules/feedback/feedback.routes";
import { healthRouter } from "../modules/health/health.routes";
import { meRouter } from "../modules/me/me.routes";
import { metricsRouter } from "../modules/metrics";
import { releasesRouter } from "../modules/releases/releases.routes";
import { uploadsRouter } from "../modules/uploads/uploads.routes";
import type { AppVariables } from "./context";

export const app = new Hono<{ Variables: AppVariables }>();

app.use("*", logger());
app.use("*", cors({ origin: [serverEnv.APP_URL, serverEnv.WEB_URL], credentials: true }));
app.use("*", sessionMiddleware);
app.onError(errorHandler);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/health", healthRouter);
app.route("/me", meRouter);
app.route("/billing", billingRouter);
app.route("/feedback", feedbackRouter);
app.route("/uploads", uploadsRouter);
app.route("/metrics", metricsRouter);
app.route("/releases", releasesRouter);
