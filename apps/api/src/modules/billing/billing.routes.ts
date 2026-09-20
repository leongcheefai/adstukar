import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type { AppVariables } from "../../lib/context";
import { handleConnectWebhook, handleWebhook } from "./billing.service";

/**
 * The two Stripe webhooks, and nothing else. The advertiser's own side of a
 * top-up lives in `../topups`, and the distributor's Stripe account in
 * `../payouts`; these routes are where Stripe's word arrives.
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

/** Events from connected accounts. A Connect endpoint signs with its own secret. */
billingRouter.post("/connect-webhook", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (!signature) throw new HTTPException(400, { message: "Missing Stripe signature" });

  const body = await c.req.text();

  try {
    await handleConnectWebhook(body, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    throw new HTTPException(400, { message });
  }

  return c.json({ received: true });
});
