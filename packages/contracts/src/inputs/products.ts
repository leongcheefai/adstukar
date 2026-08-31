import { economy } from "@repo/config/economy";
import * as z from "zod/v4";

const httpUrl = z
  .string()
  .trim()
  .url()
  .max(2048)
  .refine((v) => /^https?:\/\//i.test(v), { message: "URL must start with http:// or https://" });

export const createProductInput = z.object({
  name: z.string().trim().min(1).max(60),
  url: httpUrl,
  tagline: z.string().trim().min(1).max(economy.taglineMaxLength),
  logoUrl: httpUrl.nullable().optional(),
});

export const updateProductInput = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  url: httpUrl.optional(),
  tagline: z.string().trim().min(1).max(economy.taglineMaxLength).optional(),
  logoUrl: httpUrl.nullable().optional(),
  advertise: z.boolean().optional(),
  showAds: z.boolean().optional(),
});

export type CreateProductInput = z.infer<typeof createProductInput>;
export type UpdateProductInput = z.infer<typeof updateProductInput>;
