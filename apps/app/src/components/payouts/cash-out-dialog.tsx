import { type PayoutCountry, economy } from "@repo/config/economy";
import { usd } from "@repo/config/money";
import type { PayoutBlock, PayoutOverview } from "@repo/contracts/types";
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";
import { useConnectStripe, useRequestPayout } from "../../lib/payouts";

const COUNTRIES = economy.payout.countries;

/** "MY" reads as "Malaysia". The browser knows the names, so the list needs no table. */
function countryName(code: string): string {
  return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code;
}

/**
 * Why the button is not there. Every reason is a state a member can leave, so
 * each one says what to do next rather than only what is wrong.
 */
function blockMessage(overview: PayoutOverview, block: PayoutBlock): string {
  switch (block) {
    case "open-request":
      return "A payout is already under review. You may ask for the next one once it is paid.";
    case "stripe":
      return "Connect a Stripe account, then ask for the payout.";
    case "stripe-pending":
      return "Stripe is still checking your details. The button opens once they clear.";
    case "below-minimum":
      return `A payout takes at least ${usd(overview.minimum)}. Below that, the balance rolls over.`;
  }
}

/**
 * The cash-out panel. A Stripe account comes first, because it is on file
 * before the first payout and not at signup; the request itself takes the whole
 * withdrawable balance, and whatever has not served the hold rolls over.
 *
 * Stripe holds the identity and the bank details. This panel only sends the
 * member there and reads back whether Stripe has cleared the account.
 */
export function CashOutDialog({
  overview,
  open,
  onOpenChange,
}: {
  overview: PayoutOverview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const account = overview.stripeAccount;
  const connect = useConnectStripe();
  const request = useRequestPayout();
  // The first country in the list is the platform's own, so it is the default.
  const [country, setCountry] = useState<PayoutCountry>(COUNTRIES[0]);

  function goToStripe() {
    const origin = window.location.origin;
    connect.mutate(
      {
        country,
        returnUrl: `${origin}/dashboard/wallet?stripe=return`,
        refreshUrl: `${origin}/dashboard/wallet?stripe=refresh`,
      },
      {
        // The link lives for minutes, so the browser goes there at once.
        onSuccess: ({ url }) => {
          window.location.href = url;
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function submitRequest() {
    request.mutate(undefined, {
      onSuccess: (row) => {
        toast.success(`Payout of ${usd(row.amount)} requested`);
        onOpenChange(false);
      },
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Cash out</DialogTitle>
          <DialogDescription>
            Only earned money leaves as a payment, and only {overview.holdDays} days after it
            settles. An admin reviews each payout, then Stripe sends the money to your account.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border p-4">
          <p data-slot="label" className="text-muted-foreground">
            Ready to cash out
          </p>
          <p className="text-2xl tabular-nums">{usd(overview.withdrawable)}</p>
        </div>

        {account === null ? (
          <div className="space-y-3">
            {COUNTRIES.length === 1 ? (
              <p className="text-sm text-muted-foreground">
                Your bank account must be in {countryName(COUNTRIES[0])}. Stripe fixes the country
                when the account is made.
              </p>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="payout-country">Country of your bank account</Label>
                <Select value={country} onValueChange={(v) => setCountry(v as PayoutCountry)}>
                  <SelectTrigger id="payout-country" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((value) => (
                      <SelectItem key={value} value={value}>
                        {countryName(value)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Stripe fixes the country when the account is made. Choose the one your bank is in.
                </p>
              </div>
            )}
            <DialogFooter>
              <Button type="button" onClick={goToStripe} disabled={connect.isPending}>
                {connect.isPending ? "Opening Stripe…" : "Connect Stripe"}
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            <div className="space-y-1 rounded-lg border p-4 text-sm">
              <p data-slot="label" className="text-muted-foreground">
                We pay
              </p>
              <p className="flex items-center gap-2 font-medium">
                Your Stripe account in {countryName(account.country)}
                {account.payoutsEnabled ? (
                  <Badge variant="success">Ready</Badge>
                ) : (
                  <Badge variant="warning">Onboarding</Badge>
                )}
              </p>
              {!account.payoutsEnabled && (
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0"
                  onClick={goToStripe}
                  disabled={connect.isPending}
                >
                  {connect.isPending ? "Opening Stripe…" : "Continue on Stripe"}
                </Button>
              )}
            </div>

            {overview.block && (
              <p className="text-sm text-muted-foreground">
                {blockMessage(overview, overview.block)}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                onClick={submitRequest}
                disabled={overview.block !== null || request.isPending}
              >
                {request.isPending ? "Asking…" : "Request payout"}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
