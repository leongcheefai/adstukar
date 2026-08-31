import * as z from "zod/v4";

export const createCheckoutInput = z.object({
  priceId: z.string().min(1),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

export const createPortalInput = z.object({
  returnUrl: z.string().url(),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutInput>;
export type CreatePortalInput = z.infer<typeof createPortalInput>;
