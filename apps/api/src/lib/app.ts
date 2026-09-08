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
import { campaignsRouter } from "../modules/campaigns/campaigns.routes";
import { devicesRouter } from "../modules/devices/devices.routes";
import { feedbackRouter } from "../modules/feedback/feedback.routes";
import { healthRouter } from "../modules/health/health.routes";
import { ledgerRouter } from "../modules/ledger/ledger.routes";
import { listingsRouter } from "../modules/listings/listings.routes";
import { meRouter } from "../modules/me/me.routes";
import { placementsRouter } from "../modules/placements/placements.routes";
import { releasesRouter } from "../modules/releases/releases.routes";
import { serveRouter } from "../modules/serve/serve.routes";
import { statsRouter } from "../modules/stats/stats.routes";
import { uploadsRouter } from "../modules/uploads/uploads.routes";
import type { AppVariables } from "./context";

export const app = new Hono<{ Variables: AppVariables }>();

app.use("*", logger());

// CapyTV runs on member devices and a scan comes from a stranger's phone, so these
// four accept any origin (they never use the session cookie). Everything else stays
// locked to the dashboard and marketing origins.
const PUBLIC_PREFIXES = ["/serve", "/loop", "/report", "/scan/"];
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
app.route("/campaigns", campaignsRouter);
app.route("/listings", listingsRouter);
app.route("/devices", devicesRouter);
app.route("/placements", placementsRouter);
app.route("/stats", statsRouter);
app.route("/ledger", ledgerRouter);
app.route("/admin", adminRouter);
app.route("/", serveRouter);

// The embed bundle ships from the API so a member snippet needs no CDN. The bundle
// bakes in VITE_API_URL at build time, so it deploys with the API it calls. Production
// points VITE_EMBED_URL at this path, or at a CDN placed in front of it.
const embedDist = resolve(process.cwd(), "../embed/dist");
const embedDistExists = existsSync(embedDist);

// Without this guard a production build that skipped the embed boots clean and 404s
// every snippet. Fail at startup instead.
if (!embedDistExists && serverEnv.NODE_ENV === "production") {
  throw new Error(
    `Embed bundle not found at ${embedDist}. Run "pnpm --filter @repo/embed build" before you start the API.`,
  );
}

if (embedDistExists) {
  // The bundles are public; playground.html is a development tool. Allow the bundles
  // only, so a new file in the embed build never becomes public by accident.
  if (serverEnv.NODE_ENV === "production") {
    app.use("/embed/*", async (c, next) => {
      if (!c.req.path.endsWith(".js")) return c.notFound();
      await next();
    });
  }

  app.use(
    "/embed/*",
    serveStatic({
      root: embedDist,
      rewriteRequestPath: (path) => path.replace(/^\/embed/, ""),
      // The URL carries no version, so keep the TTL short enough to ship a same-day
      // embed fix. Version the path before you raise it.
      onFound: (_path, c) => {
        c.header("Cache-Control", "public, max-age=300, stale-while-revalidate=86400");
      },
    }),
  );
}
