import { log } from "../../lib/logger";
import { runExpiry, runPlayCleanup, runSettlement, runSlotEnd } from "./jobs.service";

const SETTLEMENT_EVERY_MS = 5 * 60_000;
const PLAY_CLEANUP_EVERY_MS = 5 * 60_000;
const EXPIRY_EVERY_MS = 24 * 3_600_000;
// A slot whose term is over waits at most this long before its position opens.
const SLOT_END_EVERY_MS = 5 * 60_000;

function guarded(name: string, fn: () => Promise<unknown>) {
  return () => fn().catch((err) => log("error", "job_failed", { job: name, message: String(err) }));
}

/** In-process scheduler for a single API instance. Returns a stop function. */
export function startJobs() {
  const settle = guarded("settlement", runSettlement);
  const expire = guarded("expiry", runExpiry);
  const cleanup = guarded("play_cleanup", runPlayCleanup);
  const endSlots = guarded("slot_end", runSlotEnd);
  const timers = [
    setInterval(settle, SETTLEMENT_EVERY_MS),
    setInterval(expire, EXPIRY_EVERY_MS),
    setInterval(cleanup, PLAY_CLEANUP_EVERY_MS),
    setInterval(endSlots, SLOT_END_EVERY_MS),
  ];
  for (const t of timers) t.unref();
  void settle();
  void expire();
  void cleanup();
  void endSlots();
  return () => {
    for (const t of timers) clearInterval(t);
  };
}
