import { economy, feeOn, playCost, scanCost } from "@repo/config/economy";
import type { LoopResponse, Promotion, ServeResponse, ServedListing } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { serverEnv } from "@repo/env";
import { and, count, eq, gte, isNotNull, lt, ne, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { shareByListing, startOfUtcDay } from "../campaigns/pacing";
import { applyPacing, notifyLowBalance } from "../campaigns/pacing.service";
import {
  budgetShare,
  spentToday,
  spentTodayByCampaign,
  spentTodayByListing,
  spentTodayForListing,
} from "../campaigns/spend";
import {
  type Tx,
  getBalances,
  getLotBalances,
  postEntry,
  postSpend,
  settlesAtFrom,
  spendable,
  spendableByUser,
} from "../ledger/ledger.service";
import { type PlaySource, clampReportedAt, expiresAtFor, planLoop } from "./loop";
import { type Candidate, matchesExcludedTerm, nextPlacement, rankCandidates } from "./ranking";

type DeviceRow = typeof schema.device.$inferSelect;
type PlacementRow = typeof schema.placement.$inferSelect;

/** The URL behind the code on screen. A scan lands here, and then on the site. */
function scanUrl(playId: string): string {
  return `${serverEnv.API_URL}/scan/${playId}`;
}

function toServedListing(name: string, tagline: string, logoUrl: string | null, playId: string) {
  return { name, tagline, logoUrl, scanUrl: scanUrl(playId) } satisfies ServedListing;
}

/**
 * The distributor's own promotion, or null when they wrote none. It moves no
 * points, so it carries no `scanUrl`: the code on a promotion goes straight to
 * the distributor's address and never through a play.
 */
function toPromotion(device: DeviceRow): Promotion | null {
  if (!device.promotionName || !device.promotionTagline) return null;
  return {
    name: device.promotionName,
    tagline: device.promotionTagline,
    logoUrl: device.promotionLogoUrl,
    url: device.promotionUrl,
  };
}

function emptyResponse(placement: PlacementRow | null): ServeResponse {
  return {
    playId: null,
    format: placement?.format ?? "band",
    size: placement?.size ?? "medium",
    dwellSeconds: placement?.dwellSeconds ?? economy.placement.dwellSeconds.default,
    gapSeconds: placement?.gapSeconds ?? economy.placement.gapSeconds.default,
    house: false,
    listing: null,
    promotion: null,
  };
}

async function loadDeviceByKey(key: string) {
  const [row] = await db.select().from(schema.device).where(eq(schema.device.apiKey, key)).limit(1);
  return row ?? null;
}

/** Every region on the device, each carrying the moment it last played. */
async function loadPlacements(deviceId: string) {
  const rows = await db
    .select({
      placement: schema.placement,
      lastPlayedAt: sql<Date | null>`max(${schema.play.createdAt})`.as("last_played_at"),
    })
    .from(schema.placement)
    .leftJoin(schema.play, eq(schema.play.placementId, schema.placement.id))
    .where(eq(schema.placement.deviceId, deviceId))
    .groupBy(schema.placement.id);

  return rows.map((r) => ({
    ...r.placement,
    lastPlayedAt: r.lastPlayedAt ? new Date(r.lastPlayedAt) : null,
  }));
}

/** The most recent play anywhere on this device. The gap is measured from it. */
async function lastPlayAt(deviceId: string): Promise<Date | null> {
  const [row] = await db
    .select({ at: sql<Date | null>`max(${schema.play.createdAt})` })
    .from(schema.play)
    .innerJoin(schema.placement, eq(schema.placement.id, schema.play.placementId))
    .where(eq(schema.placement.deviceId, deviceId));
  return row?.at ? new Date(row.at) : null;
}

/** Paid plays this device has already been counted for today. */
async function paidPlaysToday(tx: Tx, deviceId: string, now: Date): Promise<number> {
  const [row] = await tx
    .select({ n: count() })
    .from(schema.play)
    .innerJoin(schema.placement, eq(schema.placement.id, schema.play.placementId))
    .where(
      and(
        eq(schema.placement.deviceId, deviceId),
        eq(schema.play.house, false),
        eq(schema.play.state, "counted"),
        gte(schema.play.countedAt, startOfUtcDay(now)),
      ),
    );
  return row?.n ?? 0;
}

/**
 * Listings that may play on this device right now: approved creative, a running
 * campaign on a verified domain, somebody else's account, enough spendable points
 * to cover one play at this device's rate, and budget left for today.
 */
async function loadCandidates(
  device: DeviceRow,
  placement: PlacementRow,
  now: Date,
): Promise<Candidate[]> {
  const cost = playCost(device.tier, placement.format);

  const lastPlayed = db
    .select({
      listingId: schema.play.listingId,
      lastPlayedAt: sql<Date | null>`max(${schema.play.createdAt})`.as("last_played_at"),
    })
    .from(schema.play)
    .where(and(eq(schema.play.placementId, placement.id), eq(schema.play.house, false)))
    .groupBy(schema.play.listingId)
    .as("last_played");

  const [rows, budgets, listingSpend, purses] = await Promise.all([
    db
      .select({
        listingId: schema.listing.id,
        campaignId: schema.campaign.id,
        userId: schema.campaign.userId,
        name: schema.campaign.name,
        tagline: schema.listing.tagline,
        logoUrl: schema.listing.logoUrl,
        dailyBudget: schema.campaign.dailyBudget,
        lastPlayedAt: lastPlayed.lastPlayedAt,
      })
      .from(schema.listing)
      .innerJoin(schema.campaign, eq(schema.campaign.id, schema.listing.campaignId))
      .leftJoin(lastPlayed, eq(lastPlayed.listingId, schema.listing.id))
      .where(
        and(
          eq(schema.listing.state, "approved"),
          eq(schema.campaign.state, "active"),
          isNotNull(schema.campaign.verifiedAt),
          ne(schema.campaign.userId, device.userId),
        ),
      ),
    spentTodayByCampaign(db, now),
    spentTodayByListing(db, now),
    spendableByUser(),
  ]);

  // Every listing this scan returned is one that may run, so the campaign's
  // budget splits over exactly this set. A listing that has spent its share sits
  // out the rest of the day while its siblings carry on.
  const shares = shareByListing(rows);

  return rows
    .filter((row) => (purses.get(row.userId) ?? 0) >= cost)
    .filter((row) => (budgets.get(row.campaignId) ?? 0) + cost <= row.dailyBudget)
    .filter(
      (row) => (listingSpend.get(row.listingId) ?? 0) + cost <= (shares.get(row.listingId) ?? 0),
    )
    .map((row) => ({
      listingId: row.listingId,
      campaignId: row.campaignId,
      userId: row.userId,
      name: row.name,
      tagline: row.tagline,
      logoUrl: row.logoUrl,
      lastPlayedAt: row.lastPlayedAt ? new Date(row.lastPlayedAt) : null,
    }));
}

/**
 * Everything the distributor refuses on this device. The terms stop anything
 * that reads a certain way; the vetoes stop the exact creatives they looked at
 * and did not want.
 */
interface DeviceFilters {
  phrases: string[];
  vetoed: Set<string>;
}

async function loadFilters(deviceId: string): Promise<DeviceFilters> {
  const [terms, vetoes] = await Promise.all([
    db
      .select({ phrase: schema.excludedTerm.phrase })
      .from(schema.excludedTerm)
      .where(eq(schema.excludedTerm.deviceId, deviceId)),
    db
      .select({ listingId: schema.vetoedListing.listingId })
      .from(schema.vetoedListing)
      .where(eq(schema.vetoedListing.deviceId, deviceId)),
  ]);
  return {
    phrases: terms.map((t) => t.phrase),
    vetoed: new Set(vetoes.map((v) => v.listingId)),
  };
}

/** The listings this region may show, after the distributor's filters. */
async function eligibleFor(
  device: DeviceRow,
  placement: PlacementRow,
  now: Date,
  filters: DeviceFilters,
): Promise<Candidate[]> {
  const candidates = await loadCandidates(device, placement, now);
  return candidates.filter(
    (c) =>
      !filters.vetoed.has(c.listingId) && !matchesExcludedTerm(c.name, c.tagline, filters.phrases),
  );
}

/** One play about to be opened, and everything needed to describe it afterwards. */
interface PendingPlay {
  playId: string;
  expiresAt: Date;
  placement: PlacementRow;
  winner: Candidate | null;
}

function planPlay(
  placement: PlacementRow,
  winner: Candidate | null,
  source: PlaySource,
  now: Date,
): PendingPlay {
  return { playId: crypto.randomUUID(), expiresAt: expiresAtFor(source, now), placement, winner };
}

/** Writes the planned plays. One statement, so a batch is one round trip. */
async function openPlays(tx: Tx, plays: PendingPlay[], now: Date): Promise<void> {
  if (plays.length === 0) return;
  await tx.insert(schema.play).values(
    plays.map((play) => ({
      id: play.playId,
      placementId: play.placement.id,
      listingId: play.winner?.listingId ?? null,
      house: play.winner === null,
      expiresAt: play.expiresAt,
      createdAt: now,
    })),
  );
}

function toServeShape(device: DeviceRow, play: PendingPlay): ServeResponse {
  const { placement, winner, playId } = play;
  return {
    playId,
    format: placement.format,
    size: placement.size,
    dwellSeconds: placement.dwellSeconds,
    gapSeconds: placement.gapSeconds,
    house: winner === null,
    listing: winner ? toServedListing(winner.name, winner.tagline, winner.logoUrl, playId) : null,
    promotion: winner === null ? toPromotion(device) : null,
  };
}

export interface ServeContext {
  key: string;
  now?: Date;
}

/**
 * Hands CapyTV the next listing for one of the device's regions, and opens the
 * play that will carry the points. Nothing is charged here: the device reports
 * the full dwell first (see `recordReport`).
 */
export async function serveListing(ctx: ServeContext): Promise<ServeResponse> {
  const now = ctx.now ?? new Date();
  const device = await loadDeviceByKey(ctx.key);
  if (!device) throw new HTTPException(404, { message: "Unknown device key" });

  const placements = await loadPlacements(device.id);
  const placement = nextPlacement(placements);
  if (!placement) return emptyResponse(null);
  if (device.state !== "approved") return emptyResponse(placement);

  // The gap is quiet time on the whole device, not on one region: two regions
  // firing back to back would be two plays for one pair of eyes.
  const last = await lastPlayAt(device.id);
  if (last && now.getTime() - last.getTime() < placement.gapSeconds * 1000) {
    return emptyResponse(placement);
  }

  // The cap is not read here. Above it a listing still shows and simply pays
  // nothing, so the cap belongs at the moment the points move and nowhere else.
  const candidates = await eligibleFor(device, placement, now, await loadFilters(device.id));
  const winner = rankCandidates(candidates)[0] ?? null;

  const play = planPlay(placement, winner, "serve", now);
  await openPlays(db, [play], now);
  return toServeShape(device, play);
}

/**
 * Hands CapyTV a whole batch at once, so a screen whose network drops keeps
 * playing and reports the batch when the network returns.
 *
 * Nothing is charged here either, and the checks that matter run again at report
 * time: the daily cap and the campaign's budget are read when the points move,
 * not when the batch was cut. A batch is therefore an offer of plays, never a
 * promise that every one of them pays.
 */
export async function serveLoop(ctx: ServeContext & { size?: number }): Promise<LoopResponse> {
  const now = ctx.now ?? new Date();
  const size = ctx.size ?? economy.loop.size;
  const device = await loadDeviceByKey(ctx.key);
  if (!device) throw new HTTPException(404, { message: "Unknown device key" });
  if (device.state !== "approved") return { items: [] };

  const placements = await loadPlacements(device.id);
  if (placements.length === 0) return { items: [] };

  const filters = await loadFilters(device.id);

  // The cap is not read here either. A batch is an offer of plays, and what a
  // play is worth is settled when it is reported.
  const byId = new Map(placements.map((p) => [p.id, p]));
  const eligible = await Promise.all(
    placements.map(
      async (placement) =>
        [placement.id, await eligibleFor(device, placement, now, filters)] as const,
    ),
  );
  const candidatesByPlacement: Record<string, Candidate[]> = Object.fromEntries(eligible);

  const candidateById = new Map(
    Object.values(candidatesByPlacement)
      .flat()
      .map((c) => [c.listingId, c]),
  );

  const plays = planLoop({ placements, candidatesByPlacement, size }).flatMap((step) => {
    const placement = byId.get(step.placementId);
    if (!placement) return [];
    const winner = step.listingId ? (candidateById.get(step.listingId) ?? null) : null;
    return [planPlay(placement, winner, "loop", now)];
  });

  // One transaction: a half-written batch would leave open plays the device does
  // not know about, and the void job would have to clean them up hours later.
  await db.transaction((tx) => openPlays(tx, plays, now));

  return {
    items: plays.map((play) => ({
      ...toServeShape(device, play),
      playId: play.playId,
      expiresAt: play.expiresAt.toISOString(),
    })),
  };
}

/**
 * The advertiser pays, the distributor earns the same number, and the fee comes
 * back off the distributor as its own row. Nothing here is a hidden spread: the
 * two sides of a play add up to what we published.
 *
 * Returns false when the advertiser cannot cover the movement, so the caller can
 * leave the play unpaid rather than post half of it.
 */
async function chargeMovement(
  tx: Tx,
  input: {
    advertiserId: string;
    distributorId: string;
    playId: string;
    amount: number;
    key: string;
    now: Date;
  },
): Promise<boolean> {
  // Reading a balance and then spending against it is a race: two reports for one
  // advertiser would both pass the check and both post, taking the account
  // negative. The lock serializes every charge against one advertiser and lifts
  // when the transaction ends.
  await lockAdvertiser(tx, input.advertiserId);

  const balances = await getLotBalances(tx, input.advertiserId);
  if (spendable(balances) < input.amount) return false;

  const { posted } = await postSpend(tx, {
    userId: input.advertiserId,
    amount: input.amount,
    reason: "spend",
    idempotencyKey: `${input.key}:${input.playId}`,
    playId: input.playId,
    now: input.now,
  });
  // The lock makes this unreachable. If it ever fires, the advertiser has been
  // debited for less than the earn about to be posted, so the whole transaction
  // must go rather than leave the two sides of a play disagreeing.
  if (posted < input.amount) {
    throw new Error(`Partial spend on play ${input.playId}: ${posted} of ${input.amount}`);
  }

  const settlesAt = settlesAtFrom(input.now);
  await postEntry(tx, {
    userId: input.distributorId,
    delta: input.amount,
    reason: "earn",
    lot: "earned",
    state: "pending",
    idempotencyKey: `earn:${input.key}:${input.playId}`,
    playId: input.playId,
    settlesAt,
    now: input.now,
  });

  const fee = feeOn(input.amount);
  if (fee > 0) {
    await postEntry(tx, {
      userId: input.distributorId,
      delta: -fee,
      reason: "fee",
      lot: "earned",
      state: "pending",
      idempotencyKey: `fee:${input.key}:${input.playId}`,
      playId: input.playId,
      settlesAt,
      now: input.now,
    });
  }
  return true;
}

interface ChargeInput {
  campaign: { id: string; userId: string; dailyBudget: number };
  listingId: string;
  distributorId: string;
  playId: string;
  amount: number;
  /** `spend` for the play itself, `scan` for the bonus on top of it. */
  key: "spend" | "scan";
  now: Date;
}

/**
 * The one path both a play and a scan take: check the campaign's budget, check
 * the listing's share of it, charge, and then stop whatever can no longer run.
 *
 * Returns the member to mail when this charge emptied their purse, and null when
 * it did not or when a cap refused the charge.
 */
async function chargeAndPace(tx: Tx, input: ChargeInput): Promise<string | null> {
  const { campaign, now } = input;
  const spent = await spentToday(tx, campaign.id, now);
  if (spent + input.amount > campaign.dailyBudget) return null;

  // One creative running hot must not take the whole day from the three it is
  // being compared with, so each listing is paced against its own share.
  const listingSpent = await spentTodayForListing(tx, input.listingId, campaign.id, now);
  if (listingSpent + input.amount > (await budgetShare(tx, campaign, input.listingId))) return null;

  const charged = await chargeMovement(tx, {
    advertiserId: campaign.userId,
    distributorId: input.distributorId,
    playId: input.playId,
    amount: input.amount,
    key: input.key,
    now,
  });
  if (!charged) return null;

  const pacing = await applyPacing(tx, {
    campaignId: campaign.id,
    advertiserId: campaign.userId,
    spentToday: spent + input.amount,
    now,
  });
  return pacing.pausedForBalance ? campaign.userId : null;
}

/**
 * Holds one advertiser's purse for the rest of the transaction. Two charges
 * against the same account queue instead of racing; charges against different
 * accounts never touch each other.
 */
async function lockAdvertiser(tx: Tx, advertiserId: string): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${advertiserId}))`);
}

/**
 * True while this listing may still be paid for.
 *
 * A batch is cut hours before its last play is reported, so what was eligible
 * then may not be eligible now: an admin may have rejected the creative, the
 * advertiser may have paused the campaign, or the domain check may have lapsed.
 * The play still counts and still showed — it simply pays nothing.
 */
function stillBillable(
  listing: { state: string },
  campaign: { state: string; verifiedAt: Date | null },
): boolean {
  return (
    listing.state === "approved" && campaign.state === "active" && campaign.verifiedAt !== null
  );
}

/** True once a play has actually been charged for. A scan bonus rides on that. */
async function wasCharged(tx: Tx, playId: string): Promise<boolean> {
  const [row] = await tx
    .select({ n: count() })
    .from(schema.ledgerEntry)
    .where(and(eq(schema.ledgerEntry.playId, playId), eq(schema.ledgerEntry.reason, "spend")));
  return (row?.n ?? 0) > 0;
}

/** Everything a play needs to be priced: its placement, its device, and its owners. */
async function loadPlayForBilling(tx: Tx, playId: string) {
  const [row] = await tx
    .select({
      play: schema.play,
      placement: schema.placement,
      device: schema.device,
      listing: schema.listing,
      campaign: schema.campaign,
    })
    .from(schema.play)
    .innerJoin(schema.placement, eq(schema.placement.id, schema.play.placementId))
    .innerJoin(schema.device, eq(schema.device.id, schema.placement.deviceId))
    .leftJoin(schema.listing, eq(schema.listing.id, schema.play.listingId))
    .leftJoin(schema.campaign, eq(schema.campaign.id, schema.listing.campaignId))
    .where(eq(schema.play.id, playId))
    .limit(1)
    .for("update", { of: schema.play });
  return row ?? null;
}

/** One report of one play, as it arrives from a screen. */
export interface PlayReport {
  playId: string;
  /** The device key. A report whose key does not match the screen moves nothing. */
  key: string;
  /** When the report reached the server. */
  now?: Date;
  /** The moment the device says the play ran. Null when the report is live. */
  playedAt?: Date | null;
  /** The network prefix the report came from, or null when it could not be read. */
  network?: string | null;
}

/**
 * CapyTV reports that the listing held the placement for its full dwell. The play
 * counts, and the points move in the same transaction. Idempotent: a second
 * report is a no-op.
 */
export async function recordReport(report: PlayReport): Promise<{ counted: boolean }> {
  const { playId, key } = report;
  const now = report.now ?? new Date();
  const playedAt = report.playedAt ?? null;
  const network = report.network ?? null;

  const result = await db.transaction(async (tx) => {
    const row = await loadPlayForBilling(tx, playId);
    if (!row || row.device.apiKey !== key) return { counted: false, lowBalanceFor: null };

    const { play, placement, device, listing, campaign } = row;

    // The key matched, so this screen is alive whatever becomes of the play. The
    // payout review reads both: the hold exists to catch a dead screen before
    // cash leaves, and several devices on one network is a fraud signal.
    await tx
      .update(schema.device)
      .set({ lastSeenAt: now, ...(network ? { lastNetwork: network } : {}) })
      .where(eq(schema.device.id, device.id));

    if (play.state !== "open" || now > play.expiresAt) {
      return { counted: false, lowBalanceFor: null };
    }

    // A queued report carries the moment it actually played, so a day of offline
    // plays counts against the day it ran rather than the day the network came
    // back. The device is the untrusted side, so the moment is clamped to the
    // life of the play before anything is paced or capped against it.
    const countedAt = clampReportedAt({ playedAt, openedAt: play.createdAt, now });

    // The device cap counts what today already paid for, so it is read before
    // this play joins the count. Reading it after the update below would let the
    // play cap itself through and pay for only `dailyPlayCap - 1` plays a day.
    const paidToday = await paidPlaysToday(tx, device.id, countedAt);

    await tx
      .update(schema.play)
      .set({ state: "counted", countedAt })
      .where(eq(schema.play.id, playId));

    const done = { counted: true, lowBalanceFor: null };

    // A house card is a real play on screen and no movement at all.
    if (play.house || !listing || !campaign) return done;
    // Above the cap the play still showed and still counts; it just pays nothing.
    if (paidToday >= device.dailyPlayCap) return done;
    if (!stillBillable(listing, campaign)) return done;

    const lowBalanceFor = await chargeAndPace(tx, {
      campaign,
      listingId: listing.id,
      distributorId: device.userId,
      playId,
      amount: playCost(device.tier, placement.format),
      key: "spend",
      now: countedAt,
    });
    if (lowBalanceFor !== null) return { counted: true, lowBalanceFor };

    // A viewer who scanned while the screen was off the network could not be paid
    // then, because the play it rides on had not been reported yet. The report is
    // where that debt is settled.
    if (play.scanned) {
      const scanLowBalanceFor = await chargeAndPace(tx, {
        campaign,
        listingId: listing.id,
        distributorId: device.userId,
        playId,
        amount: scanCost(device.tier),
        key: "scan",
        now: countedAt,
      });
      return { counted: true, lowBalanceFor: scanLowBalanceFor };
    }
    return { counted: true, lowBalanceFor };
  });

  // The mail goes out after the charge commits, so a mail server can never roll
  // back a play.
  if (result.lowBalanceFor) notifyLowBalance(result.lowBalanceFor);
  return { counted: result.counted };
}

/**
 * A viewer scanned the code on a played listing. The scan pays a bonus on top of
 * the play, and then the viewer goes to the campaign's site.
 *
 * Returns the destination URL, or null when the play is unknown or carried no
 * listing.
 */
export async function recordScan(playId: string, now: Date = new Date()): Promise<string | null> {
  const result = await db.transaction(async (tx) => {
    const row = await loadPlayForBilling(tx, playId);
    if (!row?.listing || !row.campaign) return { url: null, lowBalanceFor: null };
    const { play, device, listing, campaign } = row;
    const stop = { url: campaign.url, lowBalanceFor: null };

    // One scan per play, and a play the void job closed is over.
    if (play.scanned || play.state === "void") return stop;

    await tx
      .update(schema.play)
      .set({ scanned: true, scannedAt: now })
      .where(eq(schema.play.id, playId));

    // The viewer's phone has its own network, so a scan can arrive while the
    // screen itself is still offline and the play is still open. Record it and
    // pay nothing now: `recordReport` settles the bonus when the screen reports
    // the play it rides on.
    if (play.state !== "counted") return stop;

    // The bonus rides on the play, so it is paid only when the play itself was
    // paid. A play the device cap or the campaign budget refused pays nothing,
    // and a scan must not be the way around either of them: the cap is what puts
    // a ceiling on what one faked screen can ever be worth (docs/adr/0003).
    if (!(await wasCharged(tx, playId))) return stop;

    const lowBalanceFor = await chargeAndPace(tx, {
      campaign,
      listingId: listing.id,
      distributorId: device.userId,
      playId,
      amount: scanCost(device.tier),
      key: "scan",
      now,
    });
    return { url: campaign.url, lowBalanceFor };
  });

  if (result.lowBalanceFor) notifyLowBalance(result.lowBalanceFor);
  return result.url;
}

/**
 * Closes every play whose report never arrived. An open play holds no points, so
 * this only stops a stale row from being reported hours later and paid for.
 * Returns the number of rows touched.
 */
export async function voidStalePlays(now: Date = new Date()): Promise<number> {
  // The deadline rides on the row, so this job never has to know whether a live
  // serve or a cached loop opened the play.
  const rows = await db
    .update(schema.play)
    .set({ state: "void" })
    .where(and(eq(schema.play.state, "open"), lt(schema.play.expiresAt, now)))
    .returning({ id: schema.play.id });
  return rows.length;
}

export { getBalances };
