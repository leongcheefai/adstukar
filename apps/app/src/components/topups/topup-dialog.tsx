import { amountToCents, centsToAmount } from "@repo/config/economy";
import { parseUsd, usdCents, usdInput } from "@repo/config/money";
import type { TopupOverview } from "@repo/contracts/types";
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
  cn,
} from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";
import { useTopUp } from "../../lib/topups";

/**
 * The top-up panel. One figure, in dollars. The presets fill the same input,
 * so a member who wants a round number and a member who wants an exact one
 * use the same control, and the bounds under it say what the wallet takes.
 */
export function TopUpDialog({
  overview,
  open,
  onOpenChange,
}: {
  overview: TopupOverview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const rule = overview.amount;
  const [text, setText] = useState<string>(centsToText(rule.presetsCents[0] ?? rule.minCents));
  const buy = useTopUp();

  const parsed = parseUsd(text);
  const cents = parsed === null ? null : amountToCents(parsed);
  const problem =
    cents === null
      ? "Enter a dollar figure, with at most two decimals."
      : cents < rule.minCents
        ? `At least ${usdCents(rule.minCents)}.`
        : cents > rule.maxCents
          ? `At most ${usdCents(rule.maxCents)}.`
          : null;

  function submit() {
    if (cents === null || problem) return;
    buy.mutate(cents, {
      onSuccess: (result) => {
        if (!result.url) {
          toast.error("Stripe did not return a checkout page. Try again.");
          return;
        }
        window.location.href = result.url;
      },
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Top up</DialogTitle>
          <DialogDescription>
            Any amount from {usdCents(rule.minCents)} to {usdCents(rule.maxCents)}. An unspent
            top-up refunds for {overview.refundWindowDays} days.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-4 gap-2">
          {rule.presetsCents.map((preset) => (
            <Button
              key={preset}
              type="button"
              variant={cents === preset ? "default" : "outline"}
              size="sm"
              onClick={() => setText(centsToText(preset))}
            >
              {usdCents(preset)}
            </Button>
          ))}
        </div>

        <div className="space-y-2">
          <Label htmlFor="topup-amount">Amount in US dollars</Label>
          <Input
            id="topup-amount"
            type="text"
            inputMode="decimal"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={centsToText(rule.presetsCents[1] ?? rule.minCents)}
            className="font-mono tabular-nums"
            aria-invalid={problem !== null}
          />
          <p className={cn("text-xs", problem ? "text-destructive" : "text-muted-foreground")}>
            {problem ?? "Whole cents only. Every amount is at the same rate."}
          </p>
        </div>

        <DialogFooter>
          <Button type="button" onClick={submit} disabled={buy.isPending || problem !== null}>
            {buy.isPending ? "Opening…" : "Continue to payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Cents as the text a member edits: "25.00", not "$25.00". */
function centsToText(cents: number): string {
  return usdInput(centsToAmount(cents));
}
