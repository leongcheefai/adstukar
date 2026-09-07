import { economy, feeOn, playCost, scanCost } from "@repo/config/economy";
import type { ServeResponse, ServedListing } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { serverEnv } from "@repo/env";
import { and, count, eq, gte, isNotNull, lt, ne, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
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

function emptyResponse(placement: PlacementRow | null): ServeResponse {
  return {
    playId: null,
    format: placement?.format ?? "band",
    size: placement?.size ?? "medium",
    dwellSeconds: placement?.dwellSeconds ?? economy.placement.dwellSeconds.default,
    gapSeconds: placement?.gapSeconds ?? economy.placement.gapSeconds.default,
    house: false,
    listing: null,
  };
}

function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
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
 * Points spent today, keyed by campaign. `campaignId` narrows it to one campaign
 * for the billing path; without it the serve path gets every campaign in one query
 * rather than one query per candidate.
 */
async function spentTodayByCampaign(
  tx: Tx,
  now: Date,
  campaignId?: string,
): Promise<Map<string, number>> {
  const conditions = [
    eq(schema.ledgerEntry.reason, "spend"),
    gte(schema.ledgerEntry.createdAt, startOfUtcDay(now)),
  ];
  if (campaignId) conditions.push(eq(schema.listing.campaignId, campaignId));

  const rows = await tx
    .select({
      campaignId: schema.listing.campaignId,
      total: sql<number>`coalesce(-sum(${schema.ledgerEntry.delta}), 0)::int`,
    })
    .from(schema.ledgerEntry)
    .innerJoin(schema.play, eq(schema.play.id, schema.ledgerEntry.playId))
    .innerJoin(schema.listing, eq(schema.listing.id, schema.play.listingId))
    .where(and(...conditions))
    .groupBy(schema.listing.campaignId);
  return new Map(rows.map((r) => [r.campaignId, r.total]));
}

/** Points this one campaign has already spent today, as a positive number. */
async function spentToday(tx: Tx, campaignId: string, now: Date): Promise<number> {
  return (await spentTodayByCampaign(tx, now, campaignId)).get(campaignId) ?? 0;
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

  const [rows, budgets, purses] = await Promise.all([
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
    spendableByUser(),
  ]);

  return rows
    .filter((row) => (purses.get(row.userId) ?? 0) >= cost)
    .filter((row) => (budgets.get(row.campaignId) ?? 0) + cost <= row.dailyBudget)
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

  const capped = (await paidPlaysToday(db, device.id, now)) >= device.dailyPlayCap;

  let winner: Candidate | null = null;
  if (!capped) {
    const terms = await db
      .select({ phrase: schema.excludedTerm.phrase })
      .from(schema.excludedTerm)
      .where(eq(schema.excludedTerm.deviceId, device.id));
    const phrases = terms.map((t) => t.phrase);

    const candidates = (await loadCandidates(device, placement, now)).filter(
      (c) => !matchesExcludedTerm(c.name, c.tagline, phrases),
    );
    winner = rankCandidates(candidates)[0] ?? null;
  }

  const playId = crypto.randomUUID();
  await db.insert(schema.play).values({
    id: playId,
    placementId: placement.id,
    listingId: winner?.listingId ?? null,
    house: winner === null,
    createdAt: now,
  });

  const listing = winner
    ? toServedListing(winner.name, winner.tagline, winner.logoUrl, playId)
    : null;

  return {
    playId,
    format: placement.format,
    size: placement.size,
    dwellSeconds: placement.dwellSeconds,
    gapSeconds: placement.gapSeconds,
    house: winner === null,
    listing,
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

/**
 * Holds one advertiser's purse for the rest of the transaction. Two charges
 * against the same account queue instead of racing; charges against different
 * accounts never touch each other.
 */
async function lockAdvertiser(tx: Tx, advertiserId: string): Promise<void> {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${advertiserId}))`);
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

/**
 * CapyTV reports that the listing held the placement for its full dwell. The play
 * counts, and the points move in the same transaction. Idempotent: a second
 * report is a no-op.
 */
export async function recordReport(
  playId: string,
  key: string,
  now: Date = new Date(),
): Promise<{ counted: boolean }> {
  return db.transaction(async (tx) => {
    const row = await loadPlayForBilling(tx, playId);
    if (!row || row.device.apiKey !== key) return { counted: false };

    const { play, placement, device, listing, campaign } = row;
    const ageMs = now.getTime() - play.createdAt.getTime();
    if (play.state !== "open" || ageMs > economy.playTtlMinutes * 60_000) {
      return { counted: false };
    }

    // Both caps count what today already paid for, so they are read before this
    // play joins the count. Reading them after the update below would let the
    // play cap itself through and pay for only `dailyPlayCap - 1` plays a day.
    const paidToday = await paidPlaysToday(tx, device.id, now);
    const spent = campaign ? await spentToday(tx, campaign.id, now) : 0;

    await tx
      .update(schema.play)
      .set({ state: "counted", countedAt: now })
      .where(eq(schema.play.id, playId));

    // A house card is a real play on screen and no movement at all.
    if (play.house || !listing || !campaign) return { counted: true };

    if (paidToday >= device.dailyPlayCap) return { counted: true };

    const cost = playCost(device.tier, placement.format);
    if (spent + cost > campaign.dailyBudget) return { counted: true };

    await chargeMovement(tx, {
      advertiserId: campaign.userId,
      distributorId: device.userId,
      playId,
      amount: cost,
      key: "spend",
      now,
    });

    return { counted: true };
  });
}

/**
 * A viewer scanned the code on a played listing. The scan pays a bonus on top of
 * the play, and then the viewer goes to the campaign's site.
 *
 * Returns the destination URL, or null when the play is unknown or carried no
 * listing.
 */
export async function recordScan(playId: string, now: Date = new Date()): Promise<string | null> {
  return db.transaction(async (tx) => {
    const row = await loadPlayForBilling(tx, playId);
    if (!row?.listing || !row.campaign) return null;
    const { play, device, campaign } = row;

    // Only a counted play may pay a bonus: a scan cannot be worth more than the
    // play it sits on, and an unreported play was never shown as far as we know.
    if (play.scanned || play.state !== "counted") return campaign.url;

    await tx
      .update(schema.play)
      .set({ scanned: true, scannedAt: now })
      .where(eq(schema.play.id, playId));

    // The bonus rides on the play, so it is paid only when the play itself was
    // paid. A play the device cap or the campaign budget refused pays nothing,
    // and a scan must not be the way around either of them: the cap is what puts
    // a ceiling on what one faked screen can ever be worth (docs/adr/0003).
    if (!(await wasCharged(tx, playId))) return campaign.url;

    const bonus = scanCost(device.tier);
    if ((await spentToday(tx, campaign.id, now)) + bonus > campaign.dailyBudget) {
      return campaign.url;
    }

    await chargeMovement(tx, {
      advertiserId: campaign.userId,
      distributorId: device.userId,
      playId,
      amount: bonus,
      key: "scan",
      now,
    });

    return campaign.url;
  });
}

/**
 * Closes every play whose report never arrived. An open play holds no points, so
 * this only stops a stale row from being reported hours later and paid for.
 * Returns the number of rows touched.
 */
export async function voidStalePlays(now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - economy.playTtlMinutes * 60_000);
  const rows = await db
    .update(schema.play)
    .set({ state: "void" })
    .where(and(eq(schema.play.state, "open"), lt(schema.play.createdAt, cutoff)))
    .returning({ id: schema.play.id });
  return rows.length;
}

export { getBalances };
