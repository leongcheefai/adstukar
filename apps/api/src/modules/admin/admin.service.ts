import { economy } from "@repo/config/economy";
import { db, schema } from "@repo/db";
import { asc, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { postEntry } from "../ledger/ledger.service";

/**
 * Human moderation queue. AI pre-scoring is a later phase: it would add a score column
 * and an ordering here, nothing else.
 */
export async function listModerationQueue() {
  const rows = await db
    .select({
      product: schema.product,
      owner: { name: schema.user.name, email: schema.user.email },
    })
    .from(schema.product)
    .innerJoin(schema.user, eq(schema.user.id, schema.product.userId))
    .where(eq(schema.product.status, "pending"))
    .orderBy(asc(schema.product.createdAt));
  return rows;
}

export async function approveProduct(productId: string, now: Date = new Date()) {
  return db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(schema.product)
      .where(eq(schema.product.id, productId))
      .limit(1)
      .for("update");
    if (!existing) throw new HTTPException(404, { message: "Product not found" });
    if (!existing.verifiedAt) throw new HTTPException(409, { message: "Domain not verified" });

    const [row] = await tx
      .update(schema.product)
      .set({ status: "approved", rejectionReason: null, updatedAt: now })
      .where(eq(schema.product.id, productId))
      .returning();
    if (!row) throw new HTTPException(404, { message: "Product not found" });

    await postEntry(tx, {
      userId: existing.userId,
      delta: economy.grants.productApproval,
      reason: "grant",
      state: "settled",
      idempotencyKey: `grant:approval:${productId}`,
      now,
    });
    return row;
  });
}

export async function rejectProduct(productId: string, reason: string, now: Date = new Date()) {
  const [row] = await db
    .update(schema.product)
    .set({ status: "rejected", rejectionReason: reason, updatedAt: now })
    .where(eq(schema.product.id, productId))
    .returning();
  if (!row) throw new HTTPException(404, { message: "Product not found" });
  return row;
}
