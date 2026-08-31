import { economy } from "@repo/config/economy";
import type { ServeResponse, ServedAd } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { serverEnv } from "@repo/env";
import { and, count, eq, gte, inArray, isNotNull, ne, sql } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { sessionHash } from "../../lib/session-hash";
import { getBalances, postEntry, settlesAtFrom } from "../ledger/ledger.service";
import { type Candidate, matchesExcludedTerm, rankCandidates, rollHouseAd } from "./ranking";

type ProductRow = typeof schema.product.$inferSelect;
type PlacementRow = typeof schema.placement.$inferSelect;

function clickUrl(impressionId: string): string {
  return `${serverEnv.API_URL}/click/${impressionId}`;
}

function toAd(product: ProductRow, impressionId: string): ServedAd {
  return {
    name: product.name,
    tagline: product.tagline,
    logoUrl: product.logoUrl,
    clickUrl: clickUrl(impressionId),
  };
}

async function loadPlacementByKey(key: string) {
  const [row] = await db
    .select({ placement: schema.placement, host: schema.product })
    .from(schema.placement)
    .innerJoin(schema.product, eq(schema.product.id, schema.placement.productId))
    .where(eq(schema.placement.apiKey, key))
    .limit(1);
  return row ?? null;
}

async function loadCandidates(placement: PlacementRow, host: ProductRow): Promise<Candidate[]> {
  const lastServed = db
    .select({
      productId: schema.impression.servedProductId,
      lastServedAt: sql<Date | null>`max(${schema.impression.createdAt})`.as("last_served_at"),
    })
    .from(schema.impression)
    .where(and(eq(schema.impression.placementId, placement.id), eq(schema.impression.house, false)))
    .groupBy(schema.impression.servedProductId)
    .as("last_served");

  const settledBalance = db
    .select({
      userId: schema.ledgerEntry.userId,
      settled: sql<number>`coalesce(sum(${schema.ledgerEntry.delta}), 0)::int`.as("settled"),
    })
    .from(schema.ledgerEntry)
    .where(eq(schema.ledgerEntry.state, "settled"))
    .groupBy(schema.ledgerEntry.userId)
    .as("balance");

  const rows = await db
    .select({
      productId: schema.product.id,
      userId: schema.product.userId,
      name: schema.product.name,
      tagline: schema.product.tagline,
      lastServedAt: lastServed.lastServedAt,
    })
    .from(schema.product)
    .innerJoin(settledBalance, eq(settledBalance.userId, schema.product.userId))
    .leftJoin(lastServed, eq(lastServed.productId, schema.product.id))
    .where(
      and(
        eq(schema.product.status, "approved"),
        eq(schema.product.advertise, true),
        isNotNull(schema.product.verifiedAt),
        ne(schema.product.userId, host.userId),
        gte(settledBalance.settled, economy.spendPerImpression),
      ),
    );

  return rows.map((r) => ({
    ...r,
    lastServedAt: r.lastServedAt ? new Date(r.lastServedAt) : null,
  }));
}

export interface ServeContext {
  key: string;
  ip: string;
  userAgent: string;
  random?: () => number;
}

export async function serveAd(ctx: ServeContext): Promise<ServeResponse> {
  const found = await loadPlacementByKey(ctx.key);
  if (!found) throw new HTTPException(404, { message: "Unknown placement key" });
  const { placement, host } = found;
  const empty: ServeResponse = { impressionId: null, size: placement.size, house: false, ad: null };

  if (!host.showAds || !host.verifiedAt) return empty;

  let winner: ProductRow | null = null;
  let house = false;

  if (!rollHouseAd(placement.houseAdPct, ctx.random)) {
    const terms = await db
      .select({ phrase: schema.excludedTerm.phrase })
      .from(schema.excludedTerm)
      .where(eq(schema.excludedTerm.placementId, placement.id));
    const phrases = terms.map((t) => t.phrase);

    const candidates = (await loadCandidates(placement, host)).filter(
      (c) => !matchesExcludedTerm(c.name, c.tagline, phrases),
    );
    const [best] = rankCandidates(candidates);
    if (best) {
      const [product] = await db
        .select()
        .from(schema.product)
        .where(eq(schema.product.id, best.productId))
        .limit(1);
      winner = product ?? null;
    }
  }

  if (!winner) {
    // House ad: the host's own product, zero cost, zero earn.
    if (host.status !== "approved") return empty;
    winner = host;
    house = true;
  }

  const impressionId = crypto.randomUUID();
  await db.insert(schema.impression).values({
    id: impressionId,
    placementId: placement.id,
    servedProductId: winner.id,
    house,
    sessionHash: sessionHash(ctx.ip, ctx.userAgent),
    createdAt: new Date(),
  });

  return { impressionId, size: placement.size, house, ad: toAd(winner, impressionId) };
}

function startOfUtcDay(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

/**
 * Marks an impression viewable and, when every cap allows it, posts the spend and
 * the earn in the same transaction. Idempotent: a second beacon is a no-op.
 */
export async function recordBeacon(
  impressionId: string,
  key: string,
  now: Date = new Date(),
): Promise<{ counted: boolean }> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .select({
        impression: schema.impression,
        placement: schema.placement,
        host: schema.product,
      })
      .from(schema.impression)
      .innerJoin(schema.placement, eq(schema.placement.id, schema.impression.placementId))
      .innerJoin(schema.product, eq(schema.product.id, schema.placement.productId))
      .where(and(eq(schema.impression.id, impressionId), eq(schema.placement.apiKey, key)))
      .limit(1)
      .for("update", { of: schema.impression });

    if (!row) return { counted: false };
    const { impression, placement, host } = row;
    const ageMs = now.getTime() - impression.createdAt.getTime();
    if (impression.viewable || ageMs > economy.impressionTtlMinutes * 60_000) {
      return { counted: false };
    }

    await tx
      .update(schema.impression)
      .set({ viewable: true, viewedAt: now })
      .where(eq(schema.impression.id, impressionId));

    if (impression.house || !impression.servedProductId) return { counted: false };

    const dayStart = startOfUtcDay(now);

    // Session cap: this visitor on this placement today (the row just updated counts).
    const [session] = await tx
      .select({ n: count() })
      .from(schema.impression)
      .where(
        and(
          eq(schema.impression.placementId, placement.id),
          eq(schema.impression.sessionHash, impression.sessionHash),
          eq(schema.impression.viewable, true),
          gte(schema.impression.viewedAt, dayStart),
        ),
      );
    if ((session?.n ?? 0) > economy.caps.perSessionPerDay) return { counted: false };

    // Domain cap: earn entries today across every placement on the host's domain.
    const [domainEarn] = await tx
      .select({ n: count() })
      .from(schema.ledgerEntry)
      .innerJoin(schema.impression, eq(schema.impression.id, schema.ledgerEntry.impressionId))
      .innerJoin(schema.placement, eq(schema.placement.id, schema.impression.placementId))
      .innerJoin(schema.product, eq(schema.product.id, schema.placement.productId))
      .where(
        and(
          eq(schema.ledgerEntry.reason, "earn"),
          eq(schema.ledgerEntry.userId, host.userId),
          eq(schema.product.domain, host.domain),
          gte(schema.ledgerEntry.createdAt, dayStart),
        ),
      );
    if ((domainEarn?.n ?? 0) >= economy.caps.newDomainDailyEarn) return { counted: false };

    const [advertiser] = await tx
      .select({ userId: schema.product.userId })
      .from(schema.product)
      .where(eq(schema.product.id, impression.servedProductId))
      .limit(1);
    if (!advertiser) return { counted: false };

    await postEntry(tx, {
      userId: advertiser.userId,
      delta: -economy.spendPerImpression,
      reason: "spend",
      state: "settled",
      idempotencyKey: `spend:${impressionId}`,
      impressionId,
      now,
    });
    await postEntry(tx, {
      userId: host.userId,
      delta: economy.earnPerImpression,
      reason: "earn",
      state: "pending",
      idempotencyKey: `earn:${impressionId}`,
      impressionId,
      settlesAt: settlesAtFrom(now),
      now,
    });

    // Milestone grant: the host's placements have shown N verified, non-house impressions.
    const hostProductIds = tx
      .select({ id: schema.product.id })
      .from(schema.product)
      .where(eq(schema.product.userId, host.userId));
    const [shown] = await tx
      .select({ n: count() })
      .from(schema.impression)
      .innerJoin(schema.placement, eq(schema.placement.id, schema.impression.placementId))
      .where(
        and(
          inArray(schema.placement.productId, hostProductIds),
          eq(schema.impression.viewable, true),
          eq(schema.impression.house, false),
        ),
      );
    if ((shown?.n ?? 0) >= economy.grants.milestoneImpressions) {
      await postEntry(tx, {
        userId: host.userId,
        delta: economy.grants.milestoneAmount,
        reason: "grant",
        state: "settled",
        idempotencyKey: `grant:milestone:${host.userId}`,
        now,
      });
    }

    return { counted: true };
  });
}

/** Marks the click once and returns the destination URL, or null when unknown. */
export async function recordClick(impressionId: string, now: Date = new Date()) {
  const [row] = await db
    .select({ impression: schema.impression, product: schema.product })
    .from(schema.impression)
    .leftJoin(schema.product, eq(schema.product.id, schema.impression.servedProductId))
    .where(eq(schema.impression.id, impressionId))
    .limit(1);
  if (!row?.product) return null;
  if (!row.impression.clicked) {
    await db
      .update(schema.impression)
      .set({ clicked: true, clickedAt: now })
      .where(and(eq(schema.impression.id, impressionId), eq(schema.impression.clicked, false)));
  }
  return row.product.url;
}

export { getBalances };
