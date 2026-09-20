import { project } from "@repo/config/project";
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
import { usd } from "../../lib/money";
import { useBuyPoints } from "../../lib/topups";

/**
 * The buy panel. Every pack sits at the same peg and none of them carries a
 * bonus, so the only thing that changes down the list is the size — which is why
 * each card names the price and nothing else tries to sell it.
 */
export function BuyPointsDialog({
  overview,
  open,
  onOpenChange,
}: {
  overview: TopupOverview;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const packs = overview.packs;
  const [points, setPoints] = useState<number>(packs[0]?.points ?? 0);
  const buy = useBuyPoints();

  function submit() {
    buy.mutate(points, {
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
          <DialogTitle>Add funds</DialogTitle>
          <DialogDescription>
            No pack carries a bonus: you get what you pay. Unspent funds refund for{" "}
            {overview.refundWindowDays} days.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-2">
          {packs.map((pack) => (
            <PackButton
              key={pack.points}
              pack={pack}
              selected={pack.points === points}
              onSelect={() => setPoints(pack.points)}
            />
          ))}
        </div>

        <DialogFooter>
          <Button type="button" onClick={submit} disabled={buy.isPending || points === 0}>
            {buy.isPending ? "Opening…" : "Continue to payment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * One pack. The points are the figure a member compares, so they lead; the price
 * follows them at the same rate every time.
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
      <span className="text-lg tabular-nums">{usd(pack.usdCents)}</span>
    </Button>
  );
}
