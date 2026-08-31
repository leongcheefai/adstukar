import * as z from "zod/v4";
import { productContract } from "../entities/product";

export const moderationItemContract = z.object({
  product: productContract,
  owner: z.object({
    name: z.string(),
    email: z.string(),
  }),
});

export const moderationQueueOutput = z.array(moderationItemContract);
export const moderateProductOutput = productContract;

export type ModerationItem = z.output<typeof moderationItemContract>;
