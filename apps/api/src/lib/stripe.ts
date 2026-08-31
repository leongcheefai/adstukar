import { serverEnv } from "@repo/env";
import Stripe from "stripe";

function createStripe() {
  if (!serverEnv.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set");
  return new Stripe(serverEnv.STRIPE_SECRET_KEY, {
    apiVersion: "2026-04-22.dahlia",
    typescript: true,
  });
}

let _stripe: Stripe | undefined;
export const stripe = new Proxy({} as Stripe, {
  get(_, prop) {
    _stripe ??= createStripe();
    return (_stripe as unknown as Record<string | symbol, unknown>)[prop];
  },
});
