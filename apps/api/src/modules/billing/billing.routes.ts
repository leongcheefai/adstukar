import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppVariables } from "../../lib/context";
import { handleWebhook } from "./billing.service";

/**
 * The Stripe webhook, and nothing else. The advertiser's own side of a top-up
 * lives in `../topups`; this route is where the money arrives.
 */
export const billingRouter = new Hono<{ Variables: AppVariables }>();

billingRouter.post("/webhook", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (!signature) throw new HTTPException(400, { message: "Missing Stripe signature" });

  // The raw body, because the signature covers the bytes Stripe sent.
  const body = await c.req.text();

  try {
    await handleWebhook(body, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    throw new HTTPException(400, { message });
  }

  return c.json({ received: true });
});
