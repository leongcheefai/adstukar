import { project } from "@repo/config/project";
import type { TopupHistoryItem, TopupRefundBlock, TopupState } from "@repo/contracts/types";
import {
  Badge,
  Button,
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
import { toast } from "sonner";
import { usd } from "../../lib/money";
import { useRefundTopup } from "../../lib/topups";

const STATE_LABEL: Record<TopupState, string> = {
  pending: "Waiting for payment",
  paid: "Paid",
  refunded: "Refunded",
  abandoned: "Not paid",
};

/** A refunded or abandoned top-up is not a failure, so neither reads as an alarm. */
const STATE_VARIANT: Record<TopupState, "warning" | "success" | "danger" | "neutral"> = {
  pending: "warning",
  paid: "success",
  refunded: "neutral",
  abandoned: "neutral",
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

/**
 * Every top-up this member made, and what each may still give back. A refund
 * returns the unspent part at the same rate it was bought at, less what the card
 * processor kept, so the row states the money before the member asks.
 */
export function TopupHistory({
  items,
  refundWindowDays,
}: {
  items: TopupHistoryItem[];
  refundWindowDays: number;
}) {
  if (items.length === 0) return null;

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium">Top-ups</h2>
      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bought</TableHead>
              <TableHead>{project.pointsName}</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Refund</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TopupRow key={item.topup.id} item={item} refundWindowDays={refundWindowDays} />
            ))}
          </TableBody>
        </Table>
      </div>
    </section>
  );
}

function TopupRow({
  item,
  refundWindowDays,
}: {
  item: TopupHistoryItem;
  refundWindowDays: number;
}) {
  const { topup, block } = item;
  const refund = useRefundTopup();

  function submit() {
    refund.mutate(topup.id, {
      onSuccess: (row) =>
        toast.success(`Refunded ${usd(row.refundUsdCents ?? 0)} for ${row.refundedPoints ?? 0}`),
      onError: (err) => toast.error(err.message),
    });
  }

  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        {new Date(topup.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="tabular-nums">{topup.points.toLocaleString()}</TableCell>
      <TableCell className="tabular-nums">{usd(topup.usdCents)}</TableCell>
      <TableCell>
        <Badge variant={STATE_VARIANT[topup.state]}>{STATE_LABEL[topup.state]}</Badge>
      </TableCell>
      <TableCell>
        {topup.state === "refunded" && (
          <span className="text-muted-foreground tabular-nums">
            {usd(topup.refundUsdCents ?? 0)} back
          </span>
        )}
        {topup.state !== "refunded" && block === null && (
          <Button variant="outline" size="sm" onClick={submit} disabled={refund.isPending}>
            {refund.isPending
              ? "Refunding…"
              : `Refund ${item.refundablePoints.toLocaleString()} · ${usd(item.refundNetCents)}`}
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
