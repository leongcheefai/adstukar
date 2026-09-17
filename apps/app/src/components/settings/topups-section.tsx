import { Receipt } from "@phosphor-icons/react";
import { project } from "@repo/config/project";
import type { TopupRefundBlock, TopupReview, TopupState } from "@repo/contracts/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Badge,
  Button,
  EmptyState,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@repo/ui";
import { useState } from "react";
import { toast } from "sonner";
import { useRefundTopup, useTopupQueue } from "../../lib/admin";
import { usd } from "../../lib/money";

const STATE_LABEL: Record<TopupState, string> = {
  pending: "Waiting for payment",
  paid: "Paid",
  refunded: "Refunded",
  abandoned: "Not paid",
};

/** Why the refund button is not there. Each one says what happened, not only that it failed. */
function blockMessage(block: TopupRefundBlock, refundWindowDays: number): string {
  switch (block) {
    case "not-paid":
      return "This top-up has no money to give back.";
    case "window-closed":
      return `A refund runs for ${refundWindowDays} days after the payment.`;
    case "nothing-left":
      return `Those ${project.pointsName} are spent. Only unspent ${project.pointsName} refund.`;
    case "below-fee":
      return "The card fee is more than this refund is worth.";
  }
}

function TopupReviewRow({
  item,
  refundWindowDays,
  onRefund,
}: {
  item: TopupReview;
  refundWindowDays: number;
  onRefund: (item: TopupReview) => void;
}) {
  const { topup, owner, block } = item;
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        {new Date(topup.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="min-w-0">
        <p data-usertext className="truncate font-medium">
          {owner.name}
        </p>
        <p data-usertext className="truncate font-mono text-xs text-muted-foreground">
          {owner.email}
        </p>
      </TableCell>
      <TableCell className="tabular-nums">{topup.points.toLocaleString()}</TableCell>
      <TableCell className="tabular-nums">{usd(topup.usdCents)}</TableCell>
      <TableCell>
        <Badge variant={topup.state === "paid" ? "success" : "neutral"}>
          {STATE_LABEL[topup.state]}
        </Badge>
      </TableCell>
      <TableCell>
        {topup.state === "refunded" && (
          <span className="text-muted-foreground tabular-nums">
            {usd(topup.refundUsdCents ?? 0)} back
          </span>
        )}
        {topup.state !== "refunded" && block === null && (
          <Button variant="outline" size="sm" onClick={() => onRefund(item)}>
            Refund {item.refundablePoints.toLocaleString()} · {usd(item.refundNetCents)}
          </Button>
        )}
        {topup.state !== "refunded" && block !== null && (
          <Tooltip>
            <TooltipTrigger className="cursor-help text-muted-foreground">—</TooltipTrigger>
            <TooltipContent>{blockMessage(block, refundWindowDays)}</TooltipContent>
          </Tooltip>
        )}
      </TableCell>
    </TableRow>
  );
}

/**
 * The refund desk. A member asks for a refund and an admin gives it from here:
 * the unspent part of one top-up, at the peg, less what the card processor kept.
 * The act moves money out of Stripe, so it asks once before it goes.
 */
export function TopupsSection() {
  const { data: queue, isLoading } = useTopupQueue();
  const refund = useRefundTopup();
  const [target, setTarget] = useState<TopupReview | null>(null);

  function confirm() {
    if (!target) return;
    refund.mutate(target.topup.id, {
      onSuccess: (row) => {
        toast.success(
          `Refunded ${usd(row.refundUsdCents ?? 0)} for ${(row.refundedPoints ?? 0).toLocaleString()} ${project.pointsName}`,
        );
        setTarget(null);
      },
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <div className="space-y-6">
      {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}

      {queue?.items.length === 0 && (
        <EmptyState
          icon={<Receipt />}
          title="No top-ups yet"
          description="A purchase appears here once a member pays for a pack."
        />
      )}

      {queue && queue.items.length > 0 && (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Bought</TableHead>
                <TableHead>Member</TableHead>
                <TableHead>{project.pointsName}</TableHead>
                <TableHead>Paid</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Refund</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.items.map((item) => (
                <TopupReviewRow
                  key={item.topup.id}
                  item={item}
                  refundWindowDays={queue.refundWindowDays}
                  onRefund={setTarget}
                />
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AlertDialog open={target !== null} onOpenChange={(open) => !open && setTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund this top-up?</AlertDialogTitle>
            <AlertDialogDescription>
              {target &&
                `${target.owner.name} gets ${usd(target.refundNetCents)} back through Stripe, and ${target.refundablePoints.toLocaleString()} ${project.pointsName} leave their account. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={refund.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => {
                // Keep the dialog open until the refund answers, so a slow
                // Stripe call cannot be pressed twice.
                event.preventDefault();
                confirm();
              }}
              disabled={refund.isPending}
            >
              {refund.isPending ? "Refunding…" : "Refund"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
