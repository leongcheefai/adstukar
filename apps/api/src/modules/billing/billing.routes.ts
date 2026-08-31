import { zValidator } from "@hono/zod-validator";
import {
  billingConfigOutput,
  checkoutOutput,
  createCheckoutInput,
  createPortalInput,
  invoicesOutput,
  portalOutput,
  subscriptionOutput,
} from "@repo/contracts";
import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import type * as z from "zod/v4";
import type { AppVariables } from "../../lib/context";
import {
  createCheckoutSession,
  createPortalSession,
  getBillingConfig,
  getSubscription,
  handleWebhook,
  listInvoices,
} from "./billing.service";

export const billingRouter = new Hono<{ Variables: AppVariables }>();

billingRouter.get("/config", async (c) => {
  const result = await getBillingConfig();
  return c.json(billingConfigOutput.parse(result satisfies z.input<typeof billingConfigOutput>));
});

billingRouter.get("/invoices", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const invoices = await listInvoices(user.id);
  return c.json(invoicesOutput.parse({ invoices } satisfies z.input<typeof invoicesOutput>));
});

billingRouter.get("/subscription", async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const subscription = await getSubscription(user.id);
  // The contract's allowlist strips stripeCustomerId / stripeSubscriptionId, which
  // the raw row previously leaked to the browser.
  return c.json(
    subscriptionOutput.parse({ subscription: subscription ?? null } satisfies z.input<
      typeof subscriptionOutput
    >),
  );
});

billingRouter.post("/checkout", zValidator("json", createCheckoutInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const input = c.req.valid("json");
  const result = await createCheckoutSession(user.id, input);
  return c.json(checkoutOutput.parse(result satisfies z.input<typeof checkoutOutput>));
});

billingRouter.post("/portal", zValidator("json", createPortalInput), async (c) => {
  const user = c.get("user");
  if (!user) throw new HTTPException(401, { message: "Unauthorized" });
  const input = c.req.valid("json");
  const result = await createPortalSession(user.id, input);
  return c.json(portalOutput.parse(result satisfies z.input<typeof portalOutput>));
});

billingRouter.post("/webhook", async (c) => {
  const signature = c.req.header("stripe-signature");
  if (!signature) throw new HTTPException(400, { message: "Missing Stripe signature" });

  const body = await c.req.text();

  try {
    await handleWebhook(body, signature);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Webhook error";
    throw new HTTPException(400, { message });
  }

  return c.json({ received: true });
});
