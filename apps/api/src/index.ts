import "./load-env";
import { serve } from "@hono/node-server";
import { serverEnv } from "@repo/env";
import { app } from "./lib/app";
import { startJobs } from "./modules/jobs/scheduler";

serve({ fetch: app.fetch, port: serverEnv.PORT }, (info) => {
  console.log(`API listening on http://localhost:${info.port}`);
});

if (serverEnv.JOBS_ENABLED) startJobs();
