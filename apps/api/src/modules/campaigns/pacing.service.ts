import { db, schema } from "@repo/db";
import type { CampaignPauseReason } from "@repo/db/enums";
import { sendLowBalanceEmail } from "@repo/emails";
import { serverEnv } from "@repo/env";
import { and, eq, inArray, isNotNull, or } from "drizzle-orm";
import { log } from "../../lib/logger";
import { type Tx, getLotBalances, spendable, spendableByUser } from "../ledger/ledger.service";
import { outOfBudget, outOfFunds, readyToResume } from "./pacing";

/**
 * The database side of pacing. A campaign stops itself when its daily budget is
 * spent or its owner's purse is empty, and it starts again when the reason is
 * gone. The rules themselves are pure and live in `pacing.ts`.
 */

/** Stops one campaign for the rest of the day. A campaign already stopped stays as it is. */
async function pauseForBudget(tx: Tx, campaignId: string, now: Date): Promise<void> {
  await tx
    .update(schema.campaign)
    .set({ state: "paused", pauseReason: "budget", pausedAt: now, updatedAt: now })
    .where(and(eq(schema.campaign.id, campaignId), eq(schema.campaign.state, "active")));
}

/**
 * Stops every campaign this member runs, because none of them can pay. A campaign
 * the budget already stopped is restamped: an empty purse outlives the day, so
 * "runs again tomorrow" would be a promise we cannot keep.
 *
 * Returns how many changed, so the caller mails the member once and not once per
 * play. A member already stopped for this reason changes nothing, and gets no
 * second mail.
 */
async function pauseForBalance(tx: Tx, userId: string, now: Date): Promise<number> {
  const rows = await tx
    .update(schema.campaign)
    .set({ state: "paused", pauseReason: "balance", pausedAt: now, updatedAt: now })
    .where(
      and(
        eq(schema.campaign.userId, userId),
        or(eq(schema.campaign.state, "active"), eq(schema.campaign.pauseReason, "budget")),
      ),
    )
    .returning({ id: schema.campaign.id });
  return rows.length;
}

export interface PacingResult {
  /** True when this charge emptied the purse and stopped the member's campaigns. */
  pausedForBalance: boolean;
}

/**
 * Reads what one charge left behind, and stops what can no longer run. It goes in
 * the same transaction as the charge, so a campaign is never shown as running
 * against money it has already spent.
 */
export async function applyPacing(
  tx: Tx,
  input: { campaignId: string; advertiserId: string; spentToday: number; now: Date },
): Promise<PacingResult> {
  const [row] = await tx
    .select({ dailyBudget: schema.campaign.dailyBudget })
    .from(schema.campaign)
    .where(eq(schema.campaign.id, input.campaignId))
    .limit(1);

  if (row && outOfBudget(input.spentToday, row.dailyBudget)) {
    await pauseForBudget(tx, input.campaignId, input.now);
  }

  const purse = spendable(await getLotBalances(tx, input.advertiserId));
  if (!outOfFunds(purse)) return { pausedForBalance: false };

  const stopped = await pauseForBalance(tx, input.advertiserId, input.now);
  return { pausedForBalance: stopped > 0 };
}

/**
 * Tells the member their balance ran out. It is sent after the charge commits and
 * never awaited: a mail server must not be able to roll back a play.
 */
export function notifyLowBalance(userId: string): void {
  void (async () => {
    const [member] = await db
      .select({ email: schema.user.email })
      .from(schema.user)
      .where(eq(schema.user.id, userId))
      .limit(1);
    if (!member) return;
    await sendLowBalanceEmail(member.email, serverEnv.APP_URL);
  })().catch((err) => log("error", "low_balance_email_failed", { userId, message: String(err) }));
}

/** A campaign the pacing sweep may move, and the owner it belongs to. */
interface PacedCampaign {
  id: string;
  userId: string;
  pauseReason: CampaignPauseReason | null;
  pausedAt: Date | null;
}

/**
 * Every campaign the sweep may move: one that is running, and one the system
 * stopped. A campaign a person paused carries no reason, and a draft or an
 * archived one is not running at all.
 */
async function pacedCampaigns(): Promise<PacedCampaign[]> {
  return db
    .select({
      id: schema.campaign.id,
      userId: schema.campaign.userId,
      pauseReason: schema.campaign.pauseReason,
      pausedAt: schema.campaign.pausedAt,
    })
    .from(schema.campaign)
    .where(
      and(
        isNotNull(schema.campaign.verifiedAt),
        or(eq(schema.campaign.state, "active"), isNotNull(schema.campaign.pauseReason)),
      ),
    );
}

export interface PacingSweep {
  /** Members whose campaigns stopped because their balance ran out. */
  stopped: number;
  /** Campaigns started again because the reason they stopped has gone. */
  resumed: number;
}

/**
 * Keeps every campaign in step with the money behind it.
 *
 * A charge stops a campaign the moment it empties the purse, but money also
 * leaves through expiry and through a payout, and neither of those touches a
 * campaign. This sweep is what catches those: it stops what can no longer pay,
 * and starts what can pay again.
 */
export async function paceCampaigns(now: Date = new Date()): Promise<PacingSweep> {
  const campaigns = await pacedCampaigns();
  if (campaigns.length === 0) return { stopped: 0, resumed: 0 };

  const purses = await spendableByUser();
  const purseOf = (userId: string) => purses.get(userId) ?? 0;

  // One member at a time, so the mail says "your campaigns stopped" once.
  const broke = new Set(
    campaigns.filter((row) => outOfFunds(purseOf(row.userId))).map((row) => row.userId),
  );
  let stopped = 0;
  for (const userId of broke) {
    if ((await pauseForBalance(db, userId, now)) === 0) continue;
    stopped += 1;
    notifyLowBalance(userId);
  }

  const due = campaigns
    .filter((row) => !broke.has(row.userId))
    .filter((row) =>
      readyToResume({
        reason: row.pauseReason,
        pausedAt: row.pausedAt,
        spendable: purseOf(row.userId),
        now,
      }),
    )
    .map((row) => row.id);
  if (due.length === 0) return { stopped, resumed: 0 };

  await db
    .update(schema.campaign)
    .set({ state: "active", pauseReason: null, pausedAt: null, updatedAt: now })
    .where(inArray(schema.campaign.id, due));
  return { stopped, resumed: due.length };
}
