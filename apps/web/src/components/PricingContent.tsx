import { project } from "@repo/config/project";
import type { BillingConfig, CheckoutResponse, CreateCheckoutInput } from "@repo/contracts/types";
import { PricingCard, Tabs, TabsList, TabsTrigger } from "@repo/ui";
import { useEffect, useState } from "react";
import { env } from "../lib/env";

const API_URL = env.PUBLIC_API_URL;

const FREE_TIER = {
  name: "Free",
  price: "$0",
  period: "/month",
  description: "TODO: Perfect for getting started and exploring.",
  features: [
    "TODO: Core feature 1",
    "TODO: Core feature 2",
    "TODO: Core feature 3",
    "TODO: Core feature 4",
  ],
  cta: { label: "Get started free", href: "/signup" },
};

const ENTERPRISE_TIER = {
  name: "Enterprise",
  price: "Custom",
  period: "",
  description: "TODO: For large teams with advanced security and compliance needs.",
  features: [
    "Everything in Pro",
    "TODO: Enterprise feature 1",
    "TODO: Enterprise feature 2",
    "SSO / SAML",
    "Dedicated support",
    "SLA guarantee",
  ],
  cta: { label: "Contact sales", href: `mailto:${project.email.support}` },
};

export function PricingContent() {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [config, setConfig] = useState<BillingConfig | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Fetch billing config
    fetch(`${API_URL}/billing/config`)
      .then((r) => r.json())
      .then((data: BillingConfig) => setConfig(data))
      .catch(() => {
        /* non-critical */
      });

    // Detect login
    fetch(`${API_URL}/me`, { credentials: "include" })
      .then((r) => {
        if (r.ok) setIsLoggedIn(true);
      })
      .catch(() => {
        /* non-critical */
      });
  }, []);

  const selectedProPriceId =
    billingCycle === "monthly" ? config?.proMonthlyPriceId : config?.proYearlyPriceId;

  const proCtaHref = `/signup?plan=pro&billing=${billingCycle}`;

  async function handleProCtaClick(e: React.MouseEvent) {
    if (isLoggedIn && selectedProPriceId) {
      e.preventDefault();
      try {
        const checkoutBody: CreateCheckoutInput = {
          priceId: selectedProPriceId,
          successUrl: `${window.location.origin}/dashboard/billing?checkout=success`,
          cancelUrl: window.location.href,
        };
        const res = await fetch(`${API_URL}/billing/checkout`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(checkoutBody),
        });
        if (!res.ok) throw new Error("checkout failed");
        const { url }: CheckoutResponse = await res.json();
        if (url) window.location.href = url;
      } catch {
        window.location.href = proCtaHref; // fallback
      }
    }
    // If not logged in or no priceId: let the <a> navigate to proCtaHref normally
  }

  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-6xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            TODO: Supporting text for your pricing page. No hidden fees.
          </p>
        </div>

        {/* Billing cycle toggle */}
        <div className="flex justify-center mb-8 mt-8">
          <Tabs
            value={billingCycle}
            onValueChange={(v) => setBillingCycle(v as "monthly" | "yearly")}
          >
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">Yearly</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          <PricingCard {...FREE_TIER} />

          <PricingCard
            name="Pro"
            price="$TODO"
            period="/month"
            description="TODO: For growing teams and serious projects."
            badge="Most popular"
            highlighted={true}
            features={[
              "Everything in Free",
              "TODO: Pro feature 1",
              "TODO: Pro feature 2",
              "TODO: Pro feature 3",
              "TODO: Pro feature 4",
              "Priority support",
            ]}
            cta={{ label: "Start free trial", href: proCtaHref, onClick: handleProCtaClick }}
          />

          <PricingCard {...ENTERPRISE_TIER} />
        </div>
        <p className="mt-8 text-center text-sm text-muted-foreground">
          All plans include a 14-day free trial. No credit card required.
        </p>
      </div>
    </div>
  );
}
