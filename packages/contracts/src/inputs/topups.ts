import * as z from "zod/v4";

/**
 * A member picks a pack by its amount, never by a price. The server looks
 * the pack up and stamps the price, so a browser can never name its own.
 */
export const createTopupInput = z.object({
  amount: z.number().int().positive(),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export type CreateTopupInput = z.infer<typeof createTopupInput>;
