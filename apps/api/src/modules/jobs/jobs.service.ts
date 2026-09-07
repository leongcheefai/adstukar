import { log } from "../../lib/logger";
import { expireDue, settleDue } from "../ledger/ledger.service";
import { voidStalePlays } from "../serve/serve.service";

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

/** An open play whose report never arrived is not a play. It moves no points. */
export async function runPlayCleanup(now: Date = new Date()) {
  const voided = await voidStalePlays(now);
  if (voided > 0) log("info", "plays_voided", { voided });
  return voided;
}

export async function runAllJobs(now: Date = new Date()) {
  return {
    settled: await runSettlement(now),
    expired: await runExpiry(now),
    voided: await runPlayCleanup(now),
  };
}
