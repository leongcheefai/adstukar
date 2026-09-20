import { pointsToUsdCents } from "@repo/config/economy";
import type { PayoutBlock, PayoutMethod, PayoutOverview } from "@repo/contracts/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { usd } from "../../lib/money";
import { pointsUsd } from "../../lib/money";
import { useRequestPayout, useSavePayoutAccount } from "../../lib/payouts";

const METHOD_LABEL: Record<PayoutMethod, string> = {
  bank: "Bank transfer",
  paypal: "PayPal",
};

const METHODS = Object.keys(METHOD_LABEL) as PayoutMethod[];

const DESTINATION_LABEL: Record<PayoutMethod, string> = {
  bank: "Account number or IBAN",
  paypal: "PayPal address",
};

/**
 * Why the button is not there. Every reason is a state a member can leave, so
 * each one says what to do next rather than only what is wrong.
 */
function blockMessage(overview: PayoutOverview, block: PayoutBlock): string {
  switch (block) {
    case "open-request":
      return "A payout is already under review. You may ask for the next one once it is paid.";
    case "identity":
      return "Add the name and the account we pay, then ask for the payout.";
    case "below-minimum":
      return `A payout takes at least ${pointsUsd(overview.minimumPoints)}. Below that, your earnings roll over.`;
  }
}

/**
 * The cash-out panel. Identity comes first, because it is on file before the
 * first payout and not at signup; the request itself takes the whole
 * withdrawable balance, and whatever has not served the hold rolls over.
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
  const account = overview.account;
  const saveAccount = useSavePayoutAccount();
  const request = useRequestPayout();
  const [editing, setEditing] = useState(account === null);
  const [legalName, setLegalName] = useState(account?.legalName ?? "");
  const [country, setCountry] = useState(account?.country ?? "");
  const [method, setMethod] = useState<PayoutMethod>(account?.method ?? "bank");
  const [destination, setDestination] = useState(account?.destination ?? "");

  // The panel keeps its own copy of the form, so a save elsewhere — or the first
  // load landing after the dialog opened — must reach it.
  useEffect(() => {
    setEditing(account === null);
    setLegalName(account?.legalName ?? "");
    setCountry(account?.country ?? "");
    setMethod(account?.method ?? "bank");
    setDestination(account?.destination ?? "");
  }, [account]);

  function submitAccount(event: React.FormEvent) {
    event.preventDefault();
    saveAccount.mutate(
      {
        legalName: legalName.trim(),
        country: country.trim(),
        method,
        destination: destination.trim(),
      },
      {
        onSuccess: () => {
          toast.success("Payout details saved");
          setEditing(false);
        },
        onError: (err) => toast.error(err.message),
      },
    );
  }

  function submitRequest() {
    request.mutate(undefined, {
      onSuccess: (row) => {
        toast.success(`Payout of ${usd(row.usdCents)} requested`);
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
            Only earned funds leave as money, and only {overview.holdDays} days after they settle.
            An admin reviews each payout and sends the money by hand.
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border p-4">
          <p data-slot="label" className="text-muted-foreground">
            Ready to cash out
          </p>
          {/* Whole cents, because that is what a payout sends. */}
          <p className="text-2xl tabular-nums">{usd(pointsToUsdCents(overview.withdrawable))}</p>
        </div>

        {editing ? (
          <form className="space-y-3" onSubmit={submitAccount}>
            <div className="space-y-1.5">
              <Label htmlFor="payout-name">Name on the account</Label>
              <Input
                id="payout-name"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                required
                maxLength={120}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payout-country">Country</Label>
              <Input
                id="payout-country"
                value={country}
                onChange={(e) => setCountry(e.target.value.toUpperCase())}
                placeholder="MY"
                required
                maxLength={2}
                className="w-24 uppercase"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payout-method">How we pay you</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PayoutMethod)}>
                <SelectTrigger id="payout-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {METHODS.map((value) => (
                    <SelectItem key={value} value={value}>
                      {METHOD_LABEL[value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="payout-destination">{DESTINATION_LABEL[method]}</Label>
              <Input
                id="payout-destination"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                required
                maxLength={200}
              />
            </div>
            <DialogFooter>
              {account && (
                <Button type="button" variant="ghost" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              )}
              <Button type="submit" disabled={saveAccount.isPending}>
                {saveAccount.isPending ? "Saving…" : "Save details"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <>
            {account && (
              <div className="space-y-1 rounded-lg border p-4 text-sm">
                <p data-slot="label" className="text-muted-foreground">
                  We pay
                </p>
                <p data-usertext className="font-medium">
                  {account.legalName}
                </p>
                <p data-usertext className="text-muted-foreground">
                  {METHOD_LABEL[account.method]} · {account.destination} · {account.country}
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0"
                  onClick={() => setEditing(true)}
                >
                  Change these details
                </Button>
              </div>
            )}

            {overview.block && overview.block !== "identity" && (
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
