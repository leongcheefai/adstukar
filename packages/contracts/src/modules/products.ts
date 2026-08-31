import * as z from "zod/v4";
import { productContract } from "../entities/product";

export const listProductsOutput = z.array(productContract);
export const productOutput = productContract;
export const deleteProductOutput = z.object({ id: z.string() });

export const verifyProductOutput = z.object({
  verified: z.boolean(),
  method: z.enum(["well-known", "dns"]).nullable(),
  message: z.string(),
});

export type VerifyProductResponse = z.output<typeof verifyProductOutput>;
export type VerificationMethod = NonNullable<VerifyProductResponse["method"]>;
