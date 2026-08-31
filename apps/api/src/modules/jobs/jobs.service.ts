import { log } from "../../lib/logger";
import { expireDue, settleDue } from "../ledger/ledger.service";

export async function runSettlement(now: Date = new Date()) {
  const settled = await settleDue(now);
  if (settled > 0) log("info", "ledger_settled", { settled });
  return settled;
}

export async function runExpiry(now: Date = new Date()) {
  const expired = await expireDue(now);
  if (expired > 0) log("info", "ledger_expired", { expired });
  return expired;
}

export async function runAllJobs(now: Date = new Date()) {
  return { settled: await runSettlement(now), expired: await runExpiry(now) };
}
