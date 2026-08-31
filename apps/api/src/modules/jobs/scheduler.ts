import { log } from "../../lib/logger";
import { runExpiry, runSettlement } from "./jobs.service";

const SETTLEMENT_EVERY_MS = 5 * 60_000;
const EXPIRY_EVERY_MS = 24 * 3_600_000;

function guarded(name: string, fn: () => Promise<unknown>) {
  return () => fn().catch((err) => log("error", "job_failed", { job: name, message: String(err) }));
}

/** In-process scheduler for a single API instance. Returns a stop function. */
export function startJobs() {
  const settle = guarded("settlement", runSettlement);
  const expire = guarded("expiry", runExpiry);
  const timers = [setInterval(settle, SETTLEMENT_EVERY_MS), setInterval(expire, EXPIRY_EVERY_MS)];
  for (const t of timers) t.unref();
  void settle();
  void expire();
  return () => {
    for (const t of timers) clearInterval(t);
  };
}
