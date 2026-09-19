import { log } from "../../lib/logger";
import { paceCampaigns } from "../campaigns/pacing.service";
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

/** An open play whose report never arrived is not a play. It moves no money. */
export async function runPlayCleanup(now: Date = new Date()) {
  const voided = await voidStalePlays(now);
  if (voided > 0) log("info", "plays_voided", { voided });
  return voided;
}

/**
 * Keeps every campaign in step with the money behind it. It stops what can no
 * longer pay — money leaves through expiry and through a payout, and neither of
 * those touches a campaign — and starts what can pay again.
 */
export async function runCampaignPacing(now: Date = new Date()) {
  const sweep = await paceCampaigns(now);
  if (sweep.stopped > 0) log("info", "campaigns_stopped", { members: sweep.stopped });
  if (sweep.resumed > 0) log("info", "campaigns_resumed", { resumed: sweep.resumed });
  return sweep;
}

export async function runAllJobs(now: Date = new Date()) {
  return {
    settled: await runSettlement(now),
    expired: await runExpiry(now),
    voided: await runPlayCleanup(now),
    paced: await runCampaignPacing(now),
  };
}
