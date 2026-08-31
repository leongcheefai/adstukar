import type { CheckoutResponse, PortalResponse } from "@repo/contracts/types";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsList,
  TabsTrigger,
} from "@repo/ui";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { planLabel, useBillingConfig, useInvoices, useSubscription } from "../../lib/billing";
import { env } from "../../lib/env";

async function createPortalSession(): Promise<PortalResponse> {
  const res = await fetch(`${env.VITE_API_URL}/billing/portal`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ returnUrl: window.location.href }),
  });
  if (!res.ok) throw new Error("Failed to create portal session");
  return res.json();
}

async function createCheckoutSession(priceId: string): Promise<CheckoutResponse> {
  const res = await fetch(`${env.VITE_API_URL}/billing/checkout`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      priceId,
      successUrl: `${window.location.origin}/dashboard/billing?checkout=success`,
      cancelUrl: window.location.href,
    }),
  });
  if (!res.ok) throw new Error("Failed to create checkout session");
  return res.json();
}

function formatStatus(status: string | null) {
  if (!status) return "Unknown";
  return status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ");
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
}

export function BillingPage() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const { data, isLoading, isPro: isActive } = useSubscription();
  const { data: config } = useBillingConfig();
  const { data: invoicesData, isLoading: invoicesLoading } = useInvoices();

  const subscription = data?.subscription;
  const invoices = invoicesData?.invoices;

  const selectedPriceId =
    billingCycle === "monthly" ? config?.proMonthlyPriceId : config?.proYearlyPriceId;

  const portalMutation = useMutation({
    mutationFn: createPortalSession,
    onSuccess: ({ url }) => {
      window.location.href = url;
    },
  });

  const checkoutMutation = useMutation({
    mutationFn: (priceId: string) => createCheckoutSession(priceId),
    onSuccess: ({ url }) => {
      if (url) window.location.href = url;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and payment details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{planLabel(subscription?.stripePriceId, config)}</CardTitle>
          <CardDescription>
            {isLoading
              ? "Loading…"
              : subscription
                ? `${formatStatus(subscription.status)} subscription`
                : "No active subscription"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {subscription?.stripeCurrentPeriodEnd && (
            <p className="text-sm text-muted-foreground">
              {subscription.cancelAtPeriodEnd
                ? `Cancels on ${formatDate(subscription.stripeCurrentPeriodEnd)}`
                : `Renews on ${formatDate(subscription.stripeCurrentPeriodEnd)}`}
            </p>
          )}

          {isActive ? (
            <Button
              variant="outline"
              onClick={() => portalMutation.mutate()}
              disabled={portalMutation.isPending}
            >
              {portalMutation.isPending ? "Redirecting…" : "Manage subscription"}
            </Button>
          ) : (
            <div className="space-y-3">
              <Tabs
                value={billingCycle}
                onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}
              >
                <TabsList>
                  <TabsTrigger value="monthly" disabled={!config?.proMonthlyPriceId}>
                    Monthly
                  </TabsTrigger>
                  <TabsTrigger value="yearly" disabled={!config?.proYearlyPriceId}>
                    Yearly
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {billingCycle === "monthly" && !config?.proMonthlyPriceId && (
                <p className="text-xs text-muted-foreground">Monthly plan not configured</p>
              )}
              {billingCycle === "yearly" && !config?.proYearlyPriceId && (
                <p className="text-xs text-muted-foreground">Yearly plan not configured</p>
              )}

              <Button
                onClick={() => {
                  if (selectedPriceId) checkoutMutation.mutate(selectedPriceId);
                }}
                disabled={checkoutMutation.isPending || !selectedPriceId}
              >
                {checkoutMutation.isPending ? "Redirecting…" : "Upgrade to Pro"}
              </Button>
            </div>
          )}

          {(portalMutation.isError || checkoutMutation.isError) && (
            <p className="text-sm text-destructive">
              {portalMutation.error?.message ?? checkoutMutation.error?.message}
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Invoice history</CardTitle>
          <CardDescription>Your past payments.</CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesLoading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : !invoices?.length ? (
            <p className="text-sm text-muted-foreground">No invoices yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Invoice</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => (
                  <TableRow key={inv.id}>
                    <TableCell>{formatDate(new Date(inv.created * 1000).toISOString())}</TableCell>
                    <TableCell>
                      {(inv.amountPaid / 100).toLocaleString(undefined, {
                        style: "currency",
                        currency: inv.currency.toUpperCase(),
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge variant={inv.status === "paid" ? "default" : "destructive"}>
                        {inv.status ?? "unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      {inv.hostedInvoiceUrl && (
                        <a
                          href={inv.hostedInvoiceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm underline"
                        >
                          View
                        </a>
                      )}
                      {inv.invoicePdf && (
                        <a
                          href={inv.invoicePdf}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm underline"
                        >
                          PDF
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
