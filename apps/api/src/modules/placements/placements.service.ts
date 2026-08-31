import type {
  CreatePlacementInput,
  SetExcludedTermsInput,
  UpdatePlacementInput,
} from "@repo/contracts";
import { db, schema } from "@repo/db";
import { and, desc, eq, inArray } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { getOwnedProduct } from "../products/products.service";
import { generateApiKey, normalizeTerms } from "./keys";

type PlacementRow = typeof schema.placement.$inferSelect;

async function termsFor(placementIds: string[]): Promise<Map<string, string[]>> {
  const map = new Map<string, string[]>();
  if (placementIds.length === 0) return map;
  const rows = await db
    .select()
    .from(schema.excludedTerm)
    .where(inArray(schema.excludedTerm.placementId, placementIds));
  for (const row of rows) {
    const list = map.get(row.placementId) ?? [];
    list.push(row.phrase);
    map.set(row.placementId, list);
  }
  return map;
}

function withTerms(rows: PlacementRow[], terms: Map<string, string[]>) {
  return rows.map((placement) => ({
    placement,
    excludedTerms: terms.get(placement.id) ?? [],
  }));
}

export async function listPlacements(userId: string, productId?: string) {
  const conditions = [eq(schema.product.userId, userId)];
  if (productId) conditions.push(eq(schema.placement.productId, productId));
  const rows = await db
    .select({ placement: schema.placement })
    .from(schema.placement)
    .innerJoin(schema.product, eq(schema.product.id, schema.placement.productId))
    .where(and(...conditions))
    .orderBy(desc(schema.placement.createdAt));
  const placements = rows.map((r) => r.placement);
  return withTerms(placements, await termsFor(placements.map((p) => p.id)));
}

export async function getOwnedPlacement(userId: string, placementId: string) {
  const [row] = await db
    .select({ placement: schema.placement })
    .from(schema.placement)
    .innerJoin(schema.product, eq(schema.product.id, schema.placement.productId))
    .where(and(eq(schema.placement.id, placementId), eq(schema.product.userId, userId)))
    .limit(1);
  if (!row) throw new HTTPException(404, { message: "Placement not found" });
  return row.placement;
}

async function single(placement: PlacementRow) {
  const [item] = withTerms([placement], await termsFor([placement.id]));
  if (!item) throw new HTTPException(500, { message: "Placement vanished" });
  return item;
}

export async function createPlacement(userId: string, input: CreatePlacementInput) {
  await getOwnedProduct(userId, input.productId);
  const [row] = await db
    .insert(schema.placement)
    .values({
      id: crypto.randomUUID(),
      productId: input.productId,
      apiKey: generateApiKey(),
      size: input.size,
      houseAdPct: input.houseAdPct,
      createdAt: new Date(),
    })
    .returning();
  if (!row) throw new HTTPException(500, { message: "Insert failed" });
  return single(row);
}

export async function updatePlacement(
  userId: string,
  placementId: string,
  input: UpdatePlacementInput,
) {
  await getOwnedPlacement(userId, placementId);
  const patch: Partial<typeof schema.placement.$inferInsert> = {};
  if (input.size !== undefined) patch.size = input.size;
  if (input.houseAdPct !== undefined) patch.houseAdPct = input.houseAdPct;
  const [row] = await db
    .update(schema.placement)
    .set(patch)
    .where(eq(schema.placement.id, placementId))
    .returning();
  if (!row) throw new HTTPException(404, { message: "Placement not found" });
  return single(row);
}

export async function rotateApiKey(userId: string, placementId: string) {
  await getOwnedPlacement(userId, placementId);
  const [row] = await db
    .update(schema.placement)
    .set({ apiKey: generateApiKey() })
    .where(eq(schema.placement.id, placementId))
    .returning();
  if (!row) throw new HTTPException(404, { message: "Placement not found" });
  return single(row);
}

export async function setExcludedTerms(
  userId: string,
  placementId: string,
  input: SetExcludedTermsInput,
) {
  const placement = await getOwnedPlacement(userId, placementId);
  const phrases = normalizeTerms(input.phrases);
  await db.transaction(async (tx) => {
    await tx.delete(schema.excludedTerm).where(eq(schema.excludedTerm.placementId, placementId));
    if (phrases.length > 0) {
      await tx
        .insert(schema.excludedTerm)
        .values(phrases.map((phrase) => ({ id: crypto.randomUUID(), placementId, phrase })));
    }
  });
  return single(placement);
}

export async function deletePlacement(userId: string, placementId: string) {
  await getOwnedPlacement(userId, placementId);
  await db.delete(schema.placement).where(eq(schema.placement.id, placementId));
  return { id: placementId };
}
