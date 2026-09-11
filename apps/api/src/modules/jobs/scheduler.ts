import { log } from "../../lib/logger";
import { runCampaignPacing, runExpiry, runPlayCleanup, runSettlement } from "./jobs.service";

const SETTLEMENT_EVERY_MS = 5 * 60_000;
const PLAY_CLEANUP_EVERY_MS = 5 * 60_000;
const EXPIRY_EVERY_MS = 24 * 3_600_000;
// A campaign waits at most this long after its budget resets, its purse fills,
// or its purse runs dry through expiry or a payout.
const CAMPAIGN_PACING_EVERY_MS = 5 * 60_000;

function guarded(name: string, fn: () => Promise<unknown>) {
  return () => fn().catch((err) => log("error", "job_failed", { job: name, message: String(err) }));
}

/** In-process scheduler for a single API instance. Returns a stop function. */
export function startJobs() {
  const settle = guarded("settlement", runSettlement);
  const expire = guarded("expiry", runExpiry);
  const cleanup = guarded("play_cleanup", runPlayCleanup);
  const pace = guarded("campaign_pacing", runCampaignPacing);
  const timers = [
    setInterval(settle, SETTLEMENT_EVERY_MS),
    setInterval(expire, EXPIRY_EVERY_MS),
    setInterval(cleanup, PLAY_CLEANUP_EVERY_MS),
    setInterval(pace, CAMPAIGN_PACING_EVERY_MS),
  ];
  for (const t of timers) t.unref();
  void settle();
  void expire();
  void cleanup();
  void pace();
  return () => {
    for (const t of timers) clearInterval(t);
  };
}
