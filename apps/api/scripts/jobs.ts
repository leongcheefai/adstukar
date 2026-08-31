import "../src/load-env";
import { closeDb } from "@repo/db";
import { runAllJobs } from "../src/modules/jobs/jobs.service";

// One-shot runner for an external cron: `pnpm --filter @repo/api jobs:run`.
const result = await runAllJobs();
console.log(JSON.stringify({ level: "info", message: "jobs_done", ...result }));
await closeDb();
