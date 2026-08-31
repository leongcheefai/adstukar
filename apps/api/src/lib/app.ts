import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { serveStatic } from "@hono/node-server/serve-static";
import { auth } from "@repo/auth";
import { serverEnv } from "@repo/env";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { sessionMiddleware } from "../middleware/auth";
import { errorHandler } from "../middleware/error";
import { adminRouter } from "../modules/admin/admin.routes";
import { billingRouter } from "../modules/billing/billing.routes";
import { feedbackRouter } from "../modules/feedback/feedback.routes";
import { healthRouter } from "../modules/health/health.routes";
import { ledgerRouter } from "../modules/ledger/ledger.routes";
import { meRouter } from "../modules/me/me.routes";
import { placementsRouter } from "../modules/placements/placements.routes";
import { productsRouter } from "../modules/products/products.routes";
import { releasesRouter } from "../modules/releases/releases.routes";
import { serveRouter } from "../modules/serve/serve.routes";
import { statsRouter } from "../modules/stats/stats.routes";
import { uploadsRouter } from "../modules/uploads/uploads.routes";
import type { AppVariables } from "./context";

export const app = new Hono<{ Variables: AppVariables }>();

app.use("*", logger());

// The embed runs on member sites: its endpoints accept any origin (they never use the
// session cookie). Everything else stays locked to the dashboard and marketing origins.
const PUBLIC_PREFIXES = ["/serve", "/beacon", "/click/"];
const TRUSTED_ORIGINS = new Set([serverEnv.APP_URL, serverEnv.WEB_URL]);
app.use(
  "*",
  cors({
    origin: (origin, c) => {
      if (PUBLIC_PREFIXES.some((p) => c.req.path.startsWith(p))) return origin || "*";
      return TRUSTED_ORIGINS.has(origin) ? origin : null;
    },
    credentials: true,
  }),
);
app.use("*", sessionMiddleware);
app.onError(errorHandler);

app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));

app.route("/health", healthRouter);
app.route("/me", meRouter);
app.route("/billing", billingRouter);
app.route("/feedback", feedbackRouter);
app.route("/uploads", uploadsRouter);
app.route("/releases", releasesRouter);
app.route("/products", productsRouter);
app.route("/placements", placementsRouter);
app.route("/stats", statsRouter);
app.route("/ledger", ledgerRouter);
app.route("/admin", adminRouter);
app.route("/", serveRouter);

// Development convenience: serve the built embed bundle (and its playground) from the
// API so a snippet works with no CDN. Production points VITE_EMBED_URL at a CDN path.
const embedDist = resolve(process.cwd(), "../embed/dist");
if (existsSync(embedDist)) {
  app.use(
    "/embed/*",
    serveStatic({
      root: embedDist,
      rewriteRequestPath: (path) => path.replace(/^\/embed/, ""),
    }),
  );
}
