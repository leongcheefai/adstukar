import type {
  BillingConfig,
  InvoicesResponse,
  SubscriptionResponse,
  SubscriptionStatus,
} from "@repo/contracts/types";
import { useQuery } from "@tanstack/react-query";
import { env } from "./env";

const PRO_STATUSES: SubscriptionStatus[] = ["active", "trialing"];

export async function fetchSubscription(): Promise<SubscriptionResponse> {
  const res = await fetch(`${env.VITE_API_URL}/billing/subscription`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch subscription");
  return res.json();
}

export function useSubscription() {
  const query = useQuery({ queryKey: ["subscription"], queryFn: fetchSubscription });
  const subscription = query.data?.subscription ?? null;
  // status is nullable in the DB, so the contract types it as nullable too.
  const isPro = !!subscription?.status && PRO_STATUSES.includes(subscription.status);
  return { ...query, subscription, isPro };
}

export async function fetchBillingConfig(): Promise<BillingConfig> {
  // Public endpoint — no credentials required
  const res = await fetch(`${env.VITE_API_URL}/billing/config`);
  if (!res.ok) throw new Error("Failed to fetch billing config");
  return res.json();
}

export function useBillingConfig() {
  return useQuery({ queryKey: ["billing", "config"], queryFn: fetchBillingConfig });
}

export async function fetchInvoices(): Promise<InvoicesResponse> {
  const res = await fetch(`${env.VITE_API_URL}/billing/invoices`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to fetch invoices");
  return res.json();
}

export function useInvoices() {
  return useQuery({ queryKey: ["billing", "invoices"], queryFn: fetchInvoices });
}

export function planLabel(
  stripePriceId: string | null | undefined,
  config: BillingConfig | undefined,
): string {
  if (!stripePriceId) return "Free";
  if (config?.proMonthlyPriceId && stripePriceId === config.proMonthlyPriceId)
    return "Pro (Monthly)";
  if (config?.proYearlyPriceId && stripePriceId === config.proYearlyPriceId) return "Pro (Yearly)";
  return "Pro";
}
