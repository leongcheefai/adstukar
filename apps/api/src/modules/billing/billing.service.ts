import { db, schema } from "@repo/db";
import { serverEnv } from "@repo/env";
import { eq } from "drizzle-orm";
import { stripe } from "../../lib/stripe";
import { applyConnectEvent } from "../payouts/payouts.service";
import { abandonTopup, recordPaidTopup } from "../topups/topups.service";

/**
 * Stripe's side of a top-up, and of a connected account. Every event is
 * verified against its endpoint's secret and recorded by id once its handler
 * has finished, so a retry of a handled event changes nothing, and a retry of
 * one that failed runs it again.
 *
 * Two endpoints, because Stripe signs events from connected accounts with a
 * Connect endpoint's own secret. `handleWebhook` takes the platform's events:
 * the two checkout events, and nothing else, because CapyChannel sells nothing
 * else through Stripe (docs/adr/0001). `handleConnectWebhook` takes the events
 * a connected account sends (docs/adr/0008).
 */

/** True when an event with this id was already handled. */
async function alreadyHandled(event: { id: string }): Promise<boolean> {
  const [row] = await db
    .select({ id: schema.webhookEvent.id })
    .from(schema.webhookEvent)
    .where(eq(schema.webhookEvent.id, event.id))
    .limit(1);
  return row !== undefined;
}

/**
 * Records the event id after its handler succeeded. Never before: an id saved
 * ahead of a handler that then threw would make Stripe's retry a no-op, and a
 * member who paid would never be credited. Every handler is idempotent on its
 * own key, so two deliveries that race past `alreadyHandled` do no harm.
 */
async function markHandled(event: { id: string; type: string }) {
  await db
    .insert(schema.webhookEvent)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing({ target: schema.webhookEvent.id });
}

export async function handleWebhook(body: string, signature: string) {
  if (!serverEnv.STRIPE_WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET not set");
  const event = stripe.webhooks.constructEvent(body, signature, serverEnv.STRIPE_WEBHOOK_SECRET);
  if (await alreadyHandled(event)) return;

  switch (event.type) {
    // The money goes in here, keyed on the payment, so the money and the ledger
    // entry are the same movement.
    case "checkout.session.completed": {
      const session = event.data.object;
      if (session.mode !== "payment") break;
      const topupId = session.metadata?.topupId ?? session.client_reference_id;
      if (!topupId || session.payment_status !== "paid" || !session.payment_intent) break;
      const paymentIntentId =
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent.id;
      await recordPaidTopup({ topupId, paymentIntentId, sessionId: session.id });
      break;
    }

    // The member opened a checkout and never paid. Nothing moved, so this only
    // closes the row the dashboard would otherwise show as pending for ever.
    case "checkout.session.expired": {
      const session = event.data.object;
      const topupId = session.metadata?.topupId ?? session.client_reference_id;
      if (session.mode === "payment" && topupId) await abandonTopup(topupId);
      break;
    }
  }
  await markHandled(event);
}

/** Events from connected accounts. Only `account.updated` changes a row. */
export async function handleConnectWebhook(body: string, signature: string) {
  if (!serverEnv.STRIPE_CONNECT_WEBHOOK_SECRET) {
    throw new Error("STRIPE_CONNECT_WEBHOOK_SECRET not set");
  }
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    serverEnv.STRIPE_CONNECT_WEBHOOK_SECRET,
  );
  if (await alreadyHandled(event)) return;
  await applyConnectEvent(event);
  await markHandled(event);
}
