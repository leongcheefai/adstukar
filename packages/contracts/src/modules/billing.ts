import * as z from "zod/v4";
import { subscriptionContract } from "../entities/subscription";

export const billingConfigOutput = z.object({
  proMonthlyPriceId: z.string().nullable(),
  proYearlyPriceId: z.string().nullable(),
});

export const subscriptionOutput = z.object({
  subscription: subscriptionContract.nullable(),
});

export const invoiceContract = z.object({
  id: z.string(),
  number: z.string().nullable(),
  amountPaid: z.number(),
  currency: z.string(),
  status: z.string().nullable(),
  created: z.number(),
  hostedInvoiceUrl: z.string().nullable(),
  invoicePdf: z.string().nullable(),
});

export const invoicesOutput = z.object({
  invoices: z.array(invoiceContract),
});

// Stripe's checkout session.url is string | null; the billing portal's is always a string.
export const checkoutOutput = z.object({ url: z.string().nullable() });
export const portalOutput = z.object({ url: z.string() });

export type BillingConfig = z.output<typeof billingConfigOutput>;
export type Invoice = z.output<typeof invoiceContract>;
export type InvoicesResponse = z.output<typeof invoicesOutput>;
export type SubscriptionResponse = z.output<typeof subscriptionOutput>;
export type CheckoutResponse = z.output<typeof checkoutOutput>;
export type PortalResponse = z.output<typeof portalOutput>;
