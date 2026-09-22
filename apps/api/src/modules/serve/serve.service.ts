import { earnPerPlay, economy } from "@repo/config/economy";
import type { LoopResponse, Promotion, ServeResponse, ServedListing } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { serverEnv } from "@repo/env";
import { and, eq, gte, isNotNull, lt, ne, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { startOfUtcDay } from "../../lib/day";
import { type Tx, getBalances, postEntry, settlesAtFrom } from "../ledger/ledger.service";
import { type PlaySource, clampReportedAt, expiresAtFor, planLoop } from "./loop";
import { playPays } from "./payable";
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
 * money, so it carries no `scanUrl`: the code on a promotion goes straight to
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

/**
 * What today already holds against the device's caps: the paid plays it was
 * counted for, and the moment its first play of the day counted. A house card
 * opens the paid hours too, because the screen was on.
 */
async function countedToday(
  tx: Tx,
  deviceId: string,
  now: Date,
): Promise<{ paid: number; firstPlayAt: Date | null }> {
  const [row] = await tx
    .select({
      paid: sql<number>`count(*) filter (where not ${schema.play.house})`.mapWith(Number),
      firstPlayAt: sql<Date | null>`min(${schema.play.countedAt})`,
    })
    .from(schema.play)
    .innerJoin(schema.placement, eq(schema.placement.id, schema.play.placementId))
    .where(
      and(
        eq(schema.placement.deviceId, deviceId),
        eq(schema.play.state, "counted"),
        gte(schema.play.countedAt, startOfUtcDay(now)),
      ),
    );
  return { paid: row?.paid ?? 0, firstPlayAt: row?.firstPlayAt ? new Date(row.firstPlayAt) : null };
}

/**
 * Listings that may play on this device right now: a running slot, an approved
 * creative, an active campaign on a verified domain, and somebody else's
 * account. Nothing about money is read here; the report reads it (docs/adr/0010).
 */
async function loadCandidates(device: DeviceRow, placement: PlacementRow): Promise<Candidate[]> {
  const lastPlayed = db
    .select({
      listingId: schema.play.listingId,
      lastPlayedAt: sql<Date | null>`max(${schema.play.createdAt})`.as("last_played_at"),
    })
    .from(schema.play)
    .where(and(eq(schema.play.placementId, placement.id), eq(schema.play.house, false)))
    .groupBy(schema.play.listingId)
    .as("last_played");

  const rows = await db
    .select({
      listingId: schema.listing.id,
      campaignId: schema.campaign.id,
      userId: schema.campaign.userId,
      name: schema.campaign.name,
      tagline: schema.listing.tagline,
      logoUrl: schema.listing.logoUrl,
      lastPlayedAt: lastPlayed.lastPlayedAt,
    })
    .from(schema.slot)
    .innerJoin(schema.campaign, eq(schema.campaign.id, schema.slot.campaignId))
    .innerJoin(schema.listing, eq(schema.listing.campaignId, schema.campaign.id))
    .leftJoin(lastPlayed, eq(lastPlayed.listingId, schema.listing.id))
    .where(
      and(
        eq(schema.slot.state, "running"),
        eq(schema.listing.state, "approved"),
        eq(schema.campaign.state, "active"),
        isNotNull(schema.campaign.verifiedAt),
        ne(schema.campaign.userId, device.userId),
      ),
    );

  return rows.map((row) => ({
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
  filters: DeviceFilters,
): Promise<Candidate[]> {
  const candidates = await loadCandidates(device, placement);
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
 * play that will carry the money. Nothing is paid here: the device reports
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
  // nothing, so the cap belongs at the moment the money moves and nowhere else.
  const candidates = await eligibleFor(device, placement, await loadFilters(device.id));
  const winner = rankCandidates(candidates)[0] ?? null;

  const play = planPlay(placement, winner, "serve", now);
  await openPlays(db, [play], now);
  return toServeShape(device, play);
}

/**
 * Hands CapyTV a whole batch at once, so a screen whose network drops keeps
 * playing and reports the batch when the network returns.
 *
 * Nothing is paid here either, and the checks that matter run again at report
 * time: the daily cap and the state of the slot are read when the money moves,
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
      async (placement) => [placement.id, await eligibleFor(device, placement, filters)] as const,
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

/** Everything a play needs to be paid: its placement, its device, its listing, and the live slot. */
async function loadPlayForReport(tx: Tx, playId: string) {
  const [row] = await tx
    .select({
      play: schema.play,
      placement: schema.placement,
      device: schema.device,
      listing: schema.listing,
      campaign: schema.campaign,
      slotState: schema.slot.state,
    })
    .from(schema.play)
    .innerJoin(schema.placement, eq(schema.placement.id, schema.play.placementId))
    .innerJoin(schema.device, eq(schema.device.id, schema.placement.deviceId))
    .leftJoin(schema.listing, eq(schema.listing.id, schema.play.listingId))
    .leftJoin(schema.campaign, eq(schema.campaign.id, schema.listing.campaignId))
    // One live slot per campaign, by a partial unique index, so this join never fans out.
    .leftJoin(
      schema.slot,
      and(eq(schema.slot.campaignId, schema.campaign.id), eq(schema.slot.state, "running")),
    )
    .where(eq(schema.play.id, playId))
    .limit(1)
    .for("update", { of: schema.play });
  return row ?? null;
}

/**
 * The one row a paid play posts: the distributor's earn, at the device's tier,
 * pending until it settles. The platform pays it from slot revenue, so there is
 * no advertiser to debit and no fee to take (docs/adr/0010). Keyed on the play,
 * so a second report of one play posts nothing twice. The key keeps the shape
 * the per-play economy used, so a play opened before the change and reported
 * after it still meets its own earlier row.
 */
async function postEarn(
  tx: Tx,
  input: { distributorId: string; tier: DeviceRow["tier"]; playId: string; now: Date },
): Promise<void> {
  await postEntry(tx, {
    userId: input.distributorId,
    delta: earnPerPlay(input.tier),
    reason: "earn",
    lot: "earned",
    state: "pending",
    idempotencyKey: `earn:spend:${input.playId}`,
    playId: input.playId,
    settlesAt: settlesAtFrom(input.now),
    now: input.now,
  });
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
 * counts, and the earn posts in the same transaction. Idempotent: a second
 * report is a no-op.
 */
export async function recordReport(report: PlayReport): Promise<{ counted: boolean }> {
  const { playId, key } = report;
  const now = report.now ?? new Date();
  const playedAt = report.playedAt ?? null;
  const network = report.network ?? null;

  return db.transaction(async (tx) => {
    const row = await loadPlayForReport(tx, playId);
    if (!row || row.device.apiKey !== key) return { counted: false };

    const { play, device, listing, campaign, slotState } = row;

    // The key matched, so this screen is alive whatever becomes of the play. The
    // payout review reads both: the hold exists to catch a dead screen before
    // cash leaves, and several devices on one network is a fraud signal.
    await tx
      .update(schema.device)
      .set({ lastSeenAt: now, ...(network ? { lastNetwork: network } : {}) })
      .where(eq(schema.device.id, device.id));

    if (play.state !== "open" || now > play.expiresAt) return { counted: false };

    // A queued report carries the moment it actually played, so a day of offline
    // plays counts against the day it ran rather than the day the network came
    // back. The device is the untrusted side, so the moment is clamped to the
    // life of the play before anything is capped against it.
    const countedAt = clampReportedAt({ playedAt, openedAt: play.createdAt, now });

    // The device caps count what today already holds, so they are read before
    // this play joins the count. Reading them after the update below would let
    // the play cap itself through and pay for only `dailyPlayCap - 1` plays a day.
    const today = await countedToday(tx, device.id, countedAt);

    await tx
      .update(schema.play)
      .set({ state: "counted", countedAt })
      .where(eq(schema.play.id, playId));

    // A house card is a real play on screen and no movement at all. Above a
    // cap, or on a slot that ended between serve and report, the play still
    // showed and still counts; it just pays nothing.
    if (!listing || !campaign) return { counted: true };
    const pays = playPays({
      house: play.house,
      paidToday: today.paid,
      dailyPlayCap: device.dailyPlayCap,
      countedAt,
      firstPlayAt: today.firstPlayAt,
      slotState,
      listingState: listing.state,
      campaignState: campaign.state,
      verifiedAt: campaign.verifiedAt,
    });
    if (!pays) return { counted: true };

    await postEarn(tx, { distributorId: device.userId, tier: device.tier, playId, now: countedAt });
    return { counted: true };
  });
}

/**
 * A viewer scanned the code on a played listing. The scan is recorded and the
 * viewer goes to the campaign's site. It moves no money: the advertiser pays a
 * flat price for the slot, and the scan-to-play ratio is what the payout review
 * reads (docs/adr/0002, docs/adr/0010).
 *
 * Returns the destination URL, or null when the play is unknown or carried no
 * listing.
 */
export async function recordScan(playId: string, now: Date = new Date()): Promise<string | null> {
  return db.transaction(async (tx) => {
    const row = await loadPlayForReport(tx, playId);
    if (!row?.listing || !row.campaign) return null;
    const { play, campaign } = row;

    // One scan per play, and a play the void job closed is over.
    if (play.scanned || play.state === "void") return campaign.url;

    await tx
      .update(schema.play)
      .set({ scanned: true, scannedAt: now })
      .where(eq(schema.play.id, playId));
    return campaign.url;
  });
}

/**
 * Closes every play whose report never arrived. An open play holds no money, so
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
