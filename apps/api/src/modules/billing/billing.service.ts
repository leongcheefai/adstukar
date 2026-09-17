import { db, schema } from "@repo/db";
import { serverEnv } from "@repo/env";
import { stripe } from "../../lib/stripe";
import { abandonTopup, recordPaidTopup } from "../topups/topups.service";

/**
 * Stripe's side of a top-up. Every event is verified against the webhook
 * secret and recorded once by id, so a retry from Stripe changes nothing.
 *
 * Only the two checkout events matter. A one-off payment is a CapyPoints
 * top-up, and CapyAds sells nothing else through Stripe: no subscription, no
 * invoice, no portal (docs/adr/0001).
 */
export async function handleWebhook(body: string, signature: string) {
  if (!serverEnv.STRIPE_WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET not set");
  const event = stripe.webhooks.constructEvent(body, signature, serverEnv.STRIPE_WEBHOOK_SECRET);

  const deduped = await db
    .insert(schema.webhookEvent)
    .values({ id: event.id, type: event.type })
    .onConflictDoNothing({ target: schema.webhookEvent.id })
    .returning({ id: schema.webhookEvent.id });
  if (deduped.length === 0) return;

  switch (event.type) {
    // The points go in here, keyed on the payment, so the money and the ledger
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
}
