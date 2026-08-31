import type { CreateCheckoutInput, CreatePortalInput } from "@repo/contracts";
import { db, schema } from "@repo/db";
import { sendPaymentFailedEmail } from "@repo/emails";
import { serverEnv } from "@repo/env";
import { eq } from "drizzle-orm";
import { stripe } from "../../lib/stripe";

type SubscriptionStatus = (typeof schema.subscriptionStatusEnum.enumValues)[number];

export async function createCheckoutSession(userId: string, input: CreateCheckoutInput) {
  const existing = await db.query.subscription.findFirst({
    where: eq(schema.subscription.userId, userId),
  });

  let customerId = existing?.stripeCustomerId ?? undefined;

  if (!customerId) {
    const customer = await stripe.customers.create({ metadata: { userId } });
    customerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: input.priceId, quantity: 1 }],
    success_url: input.successUrl,
    cancel_url: input.cancelUrl,
    // userId on session metadata so webhook can identify the user
    metadata: { userId },
    subscription_data: { metadata: { userId } },
  });

  return { url: session.url };
}

export async function createPortalSession(userId: string, input: CreatePortalInput) {
  const existing = await db.query.subscription.findFirst({
    where: eq(schema.subscription.userId, userId),
  });

  if (!existing?.stripeCustomerId) {
    throw new Error("No Stripe customer found for this user");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: existing.stripeCustomerId,
    return_url: input.returnUrl,
  });

  return { url: session.url };
}

export async function getSubscription(userId: string) {
  return db.query.subscription.findFirst({
    where: eq(schema.subscription.userId, userId),
  });
}

export async function getBillingConfig() {
  return {
    proMonthlyPriceId: serverEnv.STRIPE_PRO_PRICE_ID_MONTHLY ?? null,
    proYearlyPriceId: serverEnv.STRIPE_PRO_PRICE_ID_YEARLY ?? null,
  };
}

export async function listInvoices(userId: string) {
  const sub = await db.query.subscription.findFirst({
    where: eq(schema.subscription.userId, userId),
  });
  if (!sub?.stripeCustomerId) return [];
  const invoices = await stripe.invoices.list({ customer: sub.stripeCustomerId, limit: 24 });
  return invoices.data.map((inv) => ({
    id: inv.id,
    number: inv.number,
    amountPaid: inv.amount_paid,
    currency: inv.currency,
    status: inv.status,
    created: inv.created,
    hostedInvoiceUrl: inv.hosted_invoice_url ?? null,
    invoicePdf: inv.invoice_pdf ?? null,
  }));
}

export async function handleWebhook(body: string, signature: string) {
  if (!serverEnv.STRIPE_WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET not set");
  const event = stripe.webhooks.constructEvent(body, signature, serverEnv.STRIPE_WEBHOOK_SECRET);

  // Event-id dedup: skip already-processed events
  const deduped = await db
    .insert(schema.webhookEvent)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing({ target: schema.webhookEvent.id })
    .returning({ id: schema.webhookEvent.id });
  if (deduped.length === 0) return; // already processed

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "subscription") break;
      const userId = session.metadata?.userId;
      if (!userId || !session.customer || !session.subscription) break;

      const subId =
        typeof session.subscription === "string" ? session.subscription : session.subscription.id;
      const sub = await stripe.subscriptions.retrieve(subId);

      await upsertSubscription({
        userId,
        stripeCustomerId:
          typeof session.customer === "string" ? session.customer : session.customer.id,
        stripeSubscriptionId: sub.id,
        stripePriceId: sub.items.data[0]?.price.id ?? null,
        stripeCurrentPeriodEnd:
          sub.items.data[0]?.current_period_end != null
            ? new Date(sub.items.data[0].current_period_end * 1000)
            : null,
        cancelAtPeriodEnd: sub.cancel_at_period_end,
        status: sub.status as SubscriptionStatus,
      });
      break;
    }

    case "customer.subscription.created": {
      const sub = event.data.object;
      await syncSubscriptionFromStripe(sub);
      break;
    }

    case "customer.subscription.updated": {
      const sub = event.data.object;
      await syncSubscriptionFromStripe(sub);
      break;
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object;
      await db
        .update(schema.subscription)
        .set({ status: "canceled", updatedAt: new Date() })
        .where(eq(schema.subscription.stripeSubscriptionId, sub.id));
      break;
    }

    // Fires on successful payment. `invoice.payment_succeeded` is NOT handled separately because
    // on Stripe API ≥ 2024-09 (this project pins to 2026-04-22.dahlia) `invoice.paid` covers it.
    case "invoice.paid": {
      const invoice = event.data.object;
      const subRef = invoice.parent?.subscription_details?.subscription;
      if (!subRef) break;
      const subId = typeof subRef === "string" ? subRef : subRef.id;
      const sub = await stripe.subscriptions.retrieve(subId);
      await syncSubscriptionFromStripe(sub);
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      // In Stripe API 2026+, subscription ref lives under invoice.parent.subscription_details
      const subRef = invoice.parent?.subscription_details?.subscription;
      if (!subRef) break;
      const subId = typeof subRef === "string" ? subRef : subRef.id;

      const subRow = await db.query.subscription.findFirst({
        where: eq(schema.subscription.stripeSubscriptionId, subId),
      });
      if (!subRow) break;

      await db
        .update(schema.subscription)
        .set({ status: "past_due", updatedAt: new Date() })
        .where(eq(schema.subscription.stripeSubscriptionId, subId));

      const userRow = await db.query.user.findFirst({
        where: eq(schema.user.id, subRow.userId),
      });
      if (userRow) {
        // fire-and-forget — email failure must not cause Stripe to retry the webhook
        sendPaymentFailedEmail(userRow.email, serverEnv.APP_URL).catch((err) =>
          console.error("[billing] payment-failed email error", err),
        );
      }
      break;
    }
  }
}

async function syncSubscriptionFromStripe(
  sub: import("stripe").default.Subscription,
): Promise<void> {
  // Resolve userId: prefer metadata, fallback to DB lookup by stripeCustomerId
  let userId = sub.metadata?.userId ?? undefined;
  if (!userId) {
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;
    const existing = await db.query.subscription.findFirst({
      where: eq(schema.subscription.stripeCustomerId, customerId),
    });
    if (!existing) return; // cannot identify user, skip
    userId = existing.userId;
  }
  const periodEnd = sub.items.data[0]?.current_period_end;
  await upsertSubscription({
    userId,
    stripeCustomerId: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    stripeSubscriptionId: sub.id,
    stripePriceId: sub.items.data[0]?.price.id ?? null,
    stripeCurrentPeriodEnd: periodEnd != null ? new Date(periodEnd * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    status: sub.status as SubscriptionStatus,
  });
}

type UpsertSubscriptionParams = {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  stripePriceId: string | null;
  stripeCurrentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
  status: SubscriptionStatus;
};

async function upsertSubscription(params: UpsertSubscriptionParams) {
  const existing = await db.query.subscription.findFirst({
    where: eq(schema.subscription.userId, params.userId),
  });

  if (existing) {
    await db
      .update(schema.subscription)
      .set({
        stripeCustomerId: params.stripeCustomerId,
        stripeSubscriptionId: params.stripeSubscriptionId,
        stripePriceId: params.stripePriceId,
        stripeCurrentPeriodEnd: params.stripeCurrentPeriodEnd,
        cancelAtPeriodEnd: params.cancelAtPeriodEnd,
        status: params.status,
        updatedAt: new Date(),
      })
      .where(eq(schema.subscription.userId, params.userId));
  } else {
    await db.insert(schema.subscription).values({
      id: crypto.randomUUID(),
      userId: params.userId,
      stripeCustomerId: params.stripeCustomerId,
      stripeSubscriptionId: params.stripeSubscriptionId,
      stripePriceId: params.stripePriceId,
      stripeCurrentPeriodEnd: params.stripeCurrentPeriodEnd,
      cancelAtPeriodEnd: params.cancelAtPeriodEnd,
      status: params.status,
    });
  }
}
