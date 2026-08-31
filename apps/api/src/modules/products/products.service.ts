import { randomBytes } from "node:crypto";
import type { CreateProductInput, UpdateProductInput } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { and, desc, eq } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";
import { domainFromUrl } from "../../lib/domain";
import { verifyDomain } from "./verification";

export async function listProducts(userId: string) {
  return db
    .select()
    .from(schema.product)
    .where(eq(schema.product.userId, userId))
    .orderBy(desc(schema.product.createdAt));
}

export async function getOwnedProduct(userId: string, productId: string) {
  const [row] = await db
    .select()
    .from(schema.product)
    .where(and(eq(schema.product.id, productId), eq(schema.product.userId, userId)))
    .limit(1);
  if (!row) throw new HTTPException(404, { message: "Product not found" });
  return row;
}

function requireDomain(url: string): string {
  const domain = domainFromUrl(url);
  if (!domain) throw new HTTPException(400, { message: "URL must be a public http(s) address" });
  return domain;
}

export async function createProduct(userId: string, input: CreateProductInput) {
  const domain = requireDomain(input.url);
  const now = new Date();
  const [row] = await db
    .insert(schema.product)
    .values({
      id: crypto.randomUUID(),
      userId,
      name: input.name,
      url: input.url,
      domain,
      tagline: input.tagline,
      logoUrl: input.logoUrl ?? null,
      verificationToken: randomBytes(16).toString("hex"),
      createdAt: now,
      updatedAt: now,
    })
    .returning();
  if (!row) throw new HTTPException(500, { message: "Insert failed" });
  return row;
}

export async function updateProduct(userId: string, productId: string, input: UpdateProductInput) {
  const existing = await getOwnedProduct(userId, productId);
  const patch: Partial<typeof schema.product.$inferInsert> = { updatedAt: new Date() };

  if (input.name !== undefined) patch.name = input.name;
  if (input.tagline !== undefined) patch.tagline = input.tagline;
  if (input.logoUrl !== undefined) patch.logoUrl = input.logoUrl;
  if (input.advertise !== undefined) patch.advertise = input.advertise;
  if (input.showAds !== undefined) patch.showAds = input.showAds;
  if (input.url !== undefined) {
    const domain = requireDomain(input.url);
    patch.url = input.url;
    if (domain !== existing.domain) {
      // A new domain needs new proof of ownership and a fresh review.
      patch.domain = domain;
      patch.verifiedAt = null;
      patch.status = "pending";
      patch.rejectionReason = null;
    }
  }

  const [row] = await db
    .update(schema.product)
    .set(patch)
    .where(eq(schema.product.id, productId))
    .returning();
  if (!row) throw new HTTPException(404, { message: "Product not found" });
  return row;
}

export async function deleteProduct(userId: string, productId: string) {
  await getOwnedProduct(userId, productId);
  await db.delete(schema.product).where(eq(schema.product.id, productId));
  return { id: productId };
}

export async function verifyProduct(userId: string, productId: string) {
  const existing = await getOwnedProduct(userId, productId);
  const result = await verifyDomain(existing.domain, existing.verificationToken);
  if (result.verified) {
    await db
      .update(schema.product)
      .set({ verifiedAt: new Date(), updatedAt: new Date() })
      .where(eq(schema.product.id, productId));
  }
  return result;
}
