import { usdCents } from "@repo/config/money";
import type { TopupOverview, TopupPack } from "@repo/contracts/types";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  cn,
} from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";
import { useTopUp } from "../../lib/topups";

/**
 * The buy panel. Every pack sits at the same peg and none of them carries a
 * bonus, so the only thing that changes down the list is the size — which is why
 * each card names the price and nothing else tries to sell it.
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
  const packs = overview.packs;
  const [amount, setAmount] = useState<number>(packs[0]?.amount ?? 0);
  const buy = useTopUp();

  function submit() {
    buy.mutate(amount, {
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
            Every amount is at the same rate, and no pack carries a bonus. An unspent top-up refunds
            for {overview.refundWindowDays} days.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {packs.map((pack) => (
            <PackButton
              key={pack.amount}
              pack={pack}
              selected={pack.amount === amount}
              onSelect={() => setAmount(pack.amount)}
            />
          ))}
        </div>

        <DialogFooter>
          <Button type="button" onClick={submit} disabled={buy.isPending || amount === 0}>
            {buy.isPending ? "Opening…" : "Continue to payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * One pack. The price is the only figure, because the amount is the price.
 */
function PackButton({
  pack,
  selected,
  onSelect,
}: {
  pack: TopupPack;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      onClick={onSelect}
      aria-pressed={selected}
      className={cn(
        "h-auto flex-col items-start gap-1 p-4 text-left",
        selected && "border-primary bg-primary/5",
      )}
    >
      <span className="text-lg tabular-nums">{usdCents(pack.usdCents)}</span>
    </Button>
  );
}
