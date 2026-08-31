import { product } from "@repo/db/schema";
import { createSelectSchema } from "drizzle-zod";
import type * as z from "zod/v4";
import { toWire } from "../lib/wire";

// Owner and admin routes only. `verificationToken` is shown to the owner so they can
// publish it; public serving never returns this shape (see modules/serve.ts).
export const productContract = toWire(
  createSelectSchema(product).pick({
    id: true,
    name: true,
    url: true,
    domain: true,
    tagline: true,
    logoUrl: true,
    status: true,
    rejectionReason: true,
    verificationToken: true,
    verifiedAt: true,
    advertise: true,
    showAds: true,
    createdAt: true,
    updatedAt: true,
  }),
);

export type Product = z.output<typeof productContract>;
export type ProductStatus = Product["status"];
